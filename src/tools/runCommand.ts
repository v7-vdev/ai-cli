import { spawn, ChildProcess } from "child_process";
import { execSync } from "child_process";
import { hasShellOperators } from "../security/commands.js";

const activeProcesses = new Set<ChildProcess>();

export function killAllChildren() {
    for (const child of activeProcesses) {
        if (!child.killed && child.pid) {
            try {
                if (process.platform === "win32") {
                    execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: "ignore" });
                } else {
                    process.kill(-child.pid, "SIGKILL");
                }
            } catch {
                // Ignore errors during panic kill
            }
        }
    }
    activeProcesses.clear();
}

function tokenizeCommand(command: string): string[] {
    const tokens: string[] = [];
    let currentToken = "";
    let inQuotes: string | null = null;
    
    for (let i = 0; i < command.length; i++) {
        const char = command[i];
        
        if (inQuotes) {
            if (char === inQuotes) {
                inQuotes = null;
            } else {
                currentToken += char;
            }
        } else {
            if (char === "'" || char === '"') {
                inQuotes = char;
            } else if (char === " " || char === "\t") {
                if (currentToken.length > 0) {
                    tokens.push(currentToken);
                    currentToken = "";
                }
            } else {
                currentToken += char;
            }
        }
    }
    
    if (currentToken.length > 0) {
        tokens.push(currentToken);
    }
    
    return tokens;
}

export interface RunCommandOptions {
    cwd?: string;
    timeoutMs?: number;
}

export interface RunCommandResult {
    success: boolean;
    output: string;
    stdout: string;
    stderr: string;
    code: number | null;
}

export async function runCommand(command: string | string[], options?: RunCommandOptions): Promise<RunCommandResult> {
    if (typeof command === "string" && hasShellOperators(command)) {
        return {
            success: false,
            output: "Error: Shell operators (chaining, piping, redirection) are strictly blocked by the security runtime. Use simple sequential commands instead.",
            stdout: "",
            stderr: "Error: Shell operators blocked",
            code: 1
        };
    }

    const tokens = Array.isArray(command) ? command : tokenizeCommand(command);
    if (tokens.length === 0) {
        return { success: false, output: "Empty command.", stdout: "", stderr: "", code: 1 };
    }

    const cmd = tokens[0];
    const args = tokens.slice(1);

    if (!cmd) {
        return { success: false, output: "Empty command.", stdout: "", stderr: "", code: 1 };
    }

    return new Promise((resolve) => {
        try {
            const child = spawn(cmd, args, { 
                cwd: options?.cwd || process.cwd(), 
                shell: false, 
                detached: process.platform !== "win32",
                windowsHide: true
            });
            
            activeProcesses.add(child);
            
            let stdoutData = "";
            let stderrData = "";
            let timeoutHandle: NodeJS.Timeout | null = null;

            if (options?.timeoutMs) {
                timeoutHandle = setTimeout(() => {
                    if (!child.killed && child.pid) {
                        try {
                            if (process.platform === "win32") {
                                execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: "ignore" });
                            } else {
                                process.kill(-child.pid, "SIGKILL");
                            }
                        } catch {
                            // ignore
                        }
                    }
                    activeProcesses.delete(child);
                    resolve({
                        success: false,
                        output: `Error: Command timed out after ${options.timeoutMs}ms.\n` + stdoutData + "\n" + stderrData,
                        stdout: stdoutData,
                        stderr: `Error: Command timed out after ${options.timeoutMs}ms.\n` + stderrData,
                        code: 1
                    });
                }, options.timeoutMs);
            }

            if (child.stdout) {
                child.stdout.on("data", (data: any) => {
                    stdoutData += data.toString();
                });
            }

            if (child.stderr) {
                child.stderr.on("data", (data: any) => {
                    stderrData += data.toString();
                });
            }

            child.on("error", (err: any) => {
                if (timeoutHandle) clearTimeout(timeoutHandle);
                activeProcesses.delete(child);
                resolve({ 
                    success: false, 
                    output: `Error: ${err.message}`,
                    stdout: stdoutData,
                    stderr: `Error: ${err.message}\n${stderrData}`,
                    code: 1
                });
            });

            child.on("close", (code: number | null) => {
                if (timeoutHandle) clearTimeout(timeoutHandle);
                activeProcesses.delete(child);
                const finalOutput = (stdoutData + "\n" + stderrData).trim();
                resolve({
                    success: code === 0,
                    output: finalOutput || (code !== 0 ? `Command exited with code ${code}` : "Success"),
                    stdout: stdoutData,
                    stderr: stderrData,
                    code
                });
            });
        } catch (err: any) {
            resolve({ success: false, output: `Error: ${err.message}`, stdout: "", stderr: err.message, code: 1 });
        }
    });
}
