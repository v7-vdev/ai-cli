import chalk from "chalk";
import { AIProvider, Message } from "../providers/base/provider.js";
import { ProviderRegistry } from "../providers/registry.js";
import { McpManager } from "../mcp/client.js";
import { PermissionManager } from "../permissions/permissionManager.js";
import { AuditLogger } from "../logs/auditLogger.js";
import { WorkspaceScanner, WorkspaceMetadata } from "../workspace/index.js";
import { GitScanner, GitMetadata } from "../git/index.js";
import { ExecutionPipeline } from "../execution/pipeline.js";

export class RuntimeContext {
    public registry: ProviderRegistry;
    public history: Message[] = [];
    public mcp: McpManager;
    public cwd: string;
    public permissions: PermissionManager;
    public logger: AuditLogger;
    public workspace?: WorkspaceMetadata;
    public git?: GitMetadata;
    public pipeline: ExecutionPipeline;

    // A reference to the command parser so commands can dynamically trigger other commands
    // We type it as 'any' or a function to avoid circular dependencies
    public executeCommand: (input: string) => Promise<boolean>;

    // Interactive UI Handlers
    public requestMenuSelection?: (message: string, options: { label: string, value: string }[]) => Promise<string | null>;
    public requestTextInput?: (message: string, placeholder?: string) => Promise<string | null>;

    constructor(executeCommand: (input: string) => Promise<boolean>) {
        this.executeCommand = executeCommand;
        this.mcp = new McpManager();
        this.logger = new AuditLogger();
        this.permissions = new PermissionManager(this.logger);
        this.cwd = process.cwd();
        this.pipeline = new ExecutionPipeline(this);
        
        this.registry = new ProviderRegistry();
        this.logger.log("INFO", "CONTEXT", `Initialized ProviderRegistry with active provider: ${this.registry.getActiveProviderId()}`);

        this.initSystemPrompt();
    }

    public get provider(): AIProvider {
        return this.registry.getActiveProvider();
    }

    private initSystemPrompt() {
        this.history = [{
            role: "system",
            content: "You are an expert AI Coding Assistant CLI. You help the user by writing code, analyzing files, and running commands. Return beautiful markdown format. You have native tool calling and MCP server tools enabled!"
        }];
    }

    public addMessage(message: Message) {
        this.history.push(message);
    }

    public clearHistory() {
        this.initSystemPrompt();
    }

    public async initMcp() {
        await this.mcp.connectAll();
    }

    public async initWorkspace() {
        this.workspace = await WorkspaceScanner.scan(this.cwd, this.logger);
    }

    public async initGit() {
        this.git = await GitScanner.scan(this.cwd, this.logger);
    }
}
