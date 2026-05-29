import { spawn, ChildProcess } from "child_process";
import { hasShellOperators } from "../security/commands.js";
import { redactSecrets } from "../security/secrets.js";

const activeProcesses = new Set<ChildProcess>();

export function killAllChildren() {
    for (const child of activeProcesses) {
        if (!child.killed && child.pid) {
            try {
                if (process.platform === "win32") {
                    spawn("taskkill", ["/pid", child.pid.toString(), "/T", "/F"], { stdio: "ignore", windowsHide: true });
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

import { globalLimiter } from "../execution/limiter.js";

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

const MAX_BUFFER_SIZE = 5 * 1024 * 1024; // 5 MB

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

    return new Promise(async (resolve) => {
        await globalLimiter.acquire();
        const release = () => globalLimiter.release();

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
            let stdoutSize = 0;
            let stderrSize = 0;
            let timeoutHandle: NodeJS.Timeout | null = null;
            let limitExceeded = false;

            const killChild = () => {
                if (!child.killed && child.pid) {
                    try {
                        if (process.platform === "win32") {
                            spawn("taskkill", ["/pid", child.pid.toString(), "/T", "/F"], { stdio: "ignore", windowsHide: true });
                        } else {
                            process.kill(-child.pid, "SIGKILL");
                        }
                    } catch {
                        // ignore
                    }
                }
            };

            if (options?.timeoutMs) {
                timeoutHandle = setTimeout(() => {
                    killChild();
                    activeProcesses.delete(child);
                    const out = redactSecrets(`Error: Command timed out after ${options.timeoutMs}ms.\n` + stdoutData + "\n" + stderrData);
                    release();
                    resolve({
                        success: false,
                        output: out,
                        stdout: redactSecrets(stdoutData),
                        stderr: redactSecrets(`Error: Command timed out after ${options.timeoutMs}ms.\n` + stderrData),
                        code: 1
                    });
                }, options.timeoutMs);
            }

            if (child.stdout) {
                child.stdout.on("data", (data: Buffer) => {
                    if (limitExceeded) return;
                    stdoutSize += data.length;
                    if (stdoutSize > MAX_BUFFER_SIZE) {
                        limitExceeded = true;
                        stdoutData += "\n[SECURITY] MAX_BUFFER_EXCEEDED: Process generated over 5MB of stdout data and was forcefully terminated to prevent OOM.";
                        killChild();
                    } else {
                        stdoutData += data.toString();
                    }
                });
            }

            if (child.stderr) {
                child.stderr.on("data", (data: Buffer) => {
                    if (limitExceeded) return;
                    stderrSize += data.length;
                    if (stderrSize > MAX_BUFFER_SIZE) {
                        limitExceeded = true;
                        stderrData += "\n[SECURITY] MAX_BUFFER_EXCEEDED: Process generated over 5MB of stderr data and was forcefully terminated to prevent OOM.";
                        killChild();
                    } else {
                        stderrData += data.toString();
                    }
                });
            }

            child.on("error", (err: any) => {
                if (timeoutHandle) clearTimeout(timeoutHandle);
                activeProcesses.delete(child);
                release();
                resolve({ 
                    success: false, 
                    output: redactSecrets(`Error: ${err.message}`),
                    stdout: redactSecrets(stdoutData),
                    stderr: redactSecrets(`Error: ${err.message}\n${stderrData}`),
                    code: 1
                });
            });

            child.on("close", (code: number | null) => {
                if (timeoutHandle) clearTimeout(timeoutHandle);
                activeProcesses.delete(child);
                
                const finalCode = limitExceeded ? 1 : code;
                const successState = finalCode === 0;
                
                const finalOutput = (stdoutData + "\n" + stderrData).trim();
                const safeOutput = finalOutput || (finalCode !== 0 ? `Command exited with code ${finalCode}` : "Success");

                release();
                resolve({
                    success: successState,
                    output: redactSecrets(safeOutput),
                    stdout: redactSecrets(stdoutData),
                    stderr: redactSecrets(stderrData),
                    code: finalCode
                });
            });
        } catch (err: any) {
            release();
            resolve({ success: false, output: redactSecrets(`Error: ${err.message}`), stdout: "", stderr: redactSecrets(err.message), code: 1 });
        }
    });
}
