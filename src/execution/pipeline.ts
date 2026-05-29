import { RiskAnalysis, analyzeFileRisk, analyzeCommandRisk } from "./risk.js";
import { DiffResult, generateDiff } from "./diff.js";
import { globalExecutionSummary } from "./summary.js";
import { RuntimeContext } from "../context/runtimeContext.js";
import { writeFile } from "../tools/writeFile.js";
import { runCommand } from "../tools/runCommand.js";
import { ApprovalQueue } from "./approvalQueue.js";

export interface ApprovalRequest {
    id: string;
    executionId: string;
    type: "file" | "command" | "mcp";
    target: string;
    risk: RiskAnalysis;
    diff?: DiffResult;
    content?: string; 
    command?: string;
    resolve: (approved: boolean) => void;
}

export class ExecutionPipeline {
    private ctx: RuntimeContext;
    private _isDryRun: boolean = false;
    public isSafeMode: boolean = true;
    private aborted: boolean = false;
    private approvalHandler?: (request: ApprovalRequest) => void;
    private approvalQueue = new ApprovalQueue();

    constructor(ctx: RuntimeContext) {
        this.ctx = ctx;
    }

    public get isDryRun(): boolean {
        return this._isDryRun;
    }

    public set isDryRun(value: boolean) {
        this._isDryRun = value;
    }

    public abort() {
        this.aborted = true;
    }

    public setApprovalHandler(handler: (request: ApprovalRequest) => void) {
        this.approvalHandler = handler;
    }

    private generateExecutionId(): string {
        return `exec_${Math.random().toString(36).substring(2, 8)}`;
    }

    public recoverFromCrash() {
        this.ctx.logger.log("ERROR", "PIPELINE", "Fatal TUI error detected. Flushing approval queue.");
        console.log("\n\x1b[31;1m[FATAL] TUI Rendering crashed. Flushed pending approvals to protect orchestration state.\x1b[0m\n");
        this.approvalQueue.abortAll("TUI Render Crash");
    }

    private async promptForApproval(
        executionId: string,
        type: "file" | "command" | "mcp",
        target: string,
        risk: RiskAnalysis,
        diff?: DiffResult,
        content?: string,
        command?: string
    ): Promise<boolean> {
        if (!this.approvalHandler) {
            this.ctx.logger.log("WARN", "PIPELINE", "No approval handler registered.", executionId);
            return false;
        }

        return new Promise<boolean>((resolveOuter) => {
            this.approvalQueue.enqueue(async () => {
                return new Promise<void>((resolveInner) => {
                    const waitStart = Date.now();
                    const req: ApprovalRequest = {
                        id: Math.random().toString(36).substring(7),
                        executionId,
                        type,
                        target,
                        risk,
                        resolve: () => {}
                    };
                    
                    if (diff !== undefined) req.diff = diff;
                    if (content !== undefined) req.content = content;
                    if (command !== undefined) req.command = command;
                    
                    const timeoutMs = 60000;
                    const timer = setTimeout(() => {
                        this.ctx.logger.log("WARN", "PIPELINE", `Approval timeout for ${target}`, executionId);
                        console.log(`\n\x1b[33;1m[TIMEOUT] Pending approval for ${target} expired after 60s.\x1b[0m\n`);
                        req.resolve(false);
                    }, timeoutMs);

                    const safeResolve = (approved: boolean) => {
                        clearTimeout(timer);
                        globalExecutionSummary.totalApprovalWaitTimeMs += (Date.now() - waitStart);
                        if (approved) {
                            globalExecutionSummary.approvalCount++;
                        } else {
                            globalExecutionSummary.rejectionCount++;
                        }
                        resolveOuter(approved);
                        resolveInner();
                    };
                    
                    req.resolve = safeResolve;
                    this.approvalHandler!(req);
                });
            }, (reason) => {
                this.ctx.logger.log("WARN", "PIPELINE", `Approval request aborted: ${reason}`, executionId);
                globalExecutionSummary.rejectionCount++;
                resolveOuter(false);
            });
        });
    }

    public async executeWriteFile(filePath: string, content: string): Promise<string> {
        const executionId = this.generateExecutionId();
        const execStart = Date.now();
        
        if (this.isSafeMode) {
            this.ctx.logger.log("INFO", "PIPELINE", `[SAFE-MODE] Blocked write to ${filePath}`, executionId);
            return "[SAFE-MODE ACTIVE] Mutating operations blocked.";
        }

        try {
            const risk = analyzeFileRisk(filePath, "write", content.length);
            
            if (risk.level === "HIGH") {
                console.log(`\n\x1b[41;37;1m HIGH RISK DETECTED \x1b[0m\n\x1b[33m${risk.reason}\x1b[0m\n`);
            }

            const diffStart = Date.now();
            const diff = generateDiff(filePath, content);
            globalExecutionSummary.totalDiffTimeMs += (Date.now() - diffStart);
            
            this.ctx.logger.log("INFO", "PIPELINE", `Intercepted writeFile for ${filePath}. Risk: ${risk.level}`, executionId);

            const approved = await this.promptForApproval(executionId, "file", filePath, risk, diff, content);

            if (!approved) {
                this.ctx.logger.log("INFO", "PIPELINE", `Write denied for ${filePath}`, executionId);
                return "User denied permission to write file.";
            }

            if (this.isDryRun) {
                this.ctx.logger.log("INFO", "PIPELINE", `[DRY-RUN] Would write to ${filePath}`, executionId);
                globalExecutionSummary.addFileModification(filePath);
                return `[DRY-RUN] Successfully wrote to ${filePath}`;
            }

            const res = await writeFile(filePath, content, true);
            if (res.startsWith("ERROR: File changed externally")) {
                console.log(`\n\x1b[41;37;1m HIGH RISK BLOCKED: TOCTOU Violation \x1b[0m\n\x1b[33mFile changed externally during orchestration: ${filePath}\x1b[0m\n`);
                this.ctx.logger.log("WARN", "PIPELINE", `TOCTOU violation blocked: ${filePath}`, executionId);
            } else if (res === "CREATED" || res === "UPDATED") {
                globalExecutionSummary.addFileModification(filePath);
            }
            this.ctx.logger.log("INFO", "PIPELINE", `Executed writeFile for ${filePath}`, executionId);
            return res;
        } finally {
            globalExecutionSummary.totalExecutionTimeMs += (Date.now() - execStart);
        }
    }

    public async executeRunCommand(command: string): Promise<string> {
        const executionId = this.generateExecutionId();
        const execStart = Date.now();

        if (this.isSafeMode) {
            this.ctx.logger.log("INFO", "PIPELINE", `[SAFE-MODE] Blocked command: ${command}`, executionId);
            return "[SAFE-MODE ACTIVE] Mutating operations blocked.";
        }

        try {
            const modifiedFiles = globalExecutionSummary.getModifiedFiles();
            const risk = analyzeCommandRisk(command, modifiedFiles);
            
            if (risk.level === "HIGH") {
                console.log(`\n\x1b[41;37;1m HIGH RISK DETECTED \x1b[0m\n\x1b[33m${risk.reason}\x1b[0m\n`);
            }

            this.ctx.logger.log("INFO", "PIPELINE", `Intercepted runCommand for ${command}. Risk: ${risk.level}`, executionId);

            const approved = await this.promptForApproval(executionId, "command", command, risk, undefined, undefined, command);

            if (!approved) {
                this.ctx.logger.log("INFO", "PIPELINE", `Command denied: ${command}`, executionId);
                return "User denied permission to run command.";
            }

            if (this.isDryRun) {
                this.ctx.logger.log("INFO", "PIPELINE", `[DRY-RUN] Would run command: ${command}`, executionId);
                globalExecutionSummary.addCommandRun();
                return `[DRY-RUN] Simulated execution of: ${command}`;
            }

            const cmdStart = Date.now();
            const res = await runCommand(command);
            globalExecutionSummary.totalCommandTimeMs += (Date.now() - cmdStart);
            
            globalExecutionSummary.addCommandRun();
            this.ctx.logger.log("INFO", "PIPELINE", `Executed runCommand: ${command}`, executionId);
            return res.output;
        } finally {
            globalExecutionSummary.totalExecutionTimeMs += (Date.now() - execStart);
        }
    }

    public async executeMcp(serverName: string, toolName: string, args: any): Promise<any> {
        const executionId = this.generateExecutionId();
        const execStart = Date.now();

        if (this.isSafeMode) {
            this.ctx.logger.log("INFO", "PIPELINE", `[SAFE-MODE] Blocked MCP call: ${serverName}/${toolName}`, executionId);
            return "[SAFE-MODE ACTIVE] Mutating operations blocked.";
        }

        try {
            const mutatingCapabilities = ['write', 'update', 'insert', 'execute', 'run', 'delete', 'create'];
            const isMutating = mutatingCapabilities.some(cap => toolName.toLowerCase().includes(cap));

            const risk: RiskAnalysis = {
                level: isMutating ? "HIGH" : "MEDIUM",
                reason: isMutating ? `Mutating MCP capability detected: ${serverName}/${toolName}` : `Executing external MCP tool: ${serverName}/${toolName}`
            };

            const target = `${serverName}/${toolName}`;
            this.ctx.logger.log("INFO", "PIPELINE", `Intercepted MCP call for ${target}.`, executionId);

            const approved = await this.promptForApproval(executionId, "mcp", target, risk, undefined, JSON.stringify(args, null, 2));

            if (!approved) {
                this.ctx.logger.log("INFO", "PIPELINE", `MCP call denied: ${target}`, executionId);
                return "User denied permission to run MCP tool.";
            }

            if (this.isDryRun) {
                this.ctx.logger.log("INFO", "PIPELINE", `[DRY-RUN] Would execute MCP tool: ${target}`, executionId);
                globalExecutionSummary.addCommandRun();
                return `[DRY-RUN] Simulated MCP call for ${target}`;
            }

            const res = await this.ctx.mcp.callMcpTool(serverName, toolName, args);
            globalExecutionSummary.addCommandRun();
            this.ctx.logger.log("INFO", "PIPELINE", `Executed MCP call: ${target}`, executionId);
            return res;
        } catch (err: any) {
            this.ctx.logger.log("ERROR", "PIPELINE", `MCP call failed: ${err.message}`, executionId);
            return `Error: ${err.message}`;
        } finally {
            globalExecutionSummary.totalExecutionTimeMs += (Date.now() - execStart);
        }
    }
}
