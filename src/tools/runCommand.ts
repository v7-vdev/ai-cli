import { spawn } from "child_process";
import { hasShellOperators } from "../security/commands.js";

function tokenizeCommand(command: string): string[] {
    // Basic tokenizer that handles quotes (single and double)
    const tokens: string[] = [];
    let currentToken = "";
    let inQuotes: string | null = null;
    
    for (let i = 0; i < command.length; i++) {
        const char = command[i];
        
        if (inQuotes) {
            if (char === inQuotes) {
                inQuotes = null; // Close quote
            } else {
                currentToken += char;
            }
        } else {
            if (char === "'" || char === '"') {
                inQuotes = char; // Open quote
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

export async function runCommand(command: string): Promise<{ success: boolean; output: string }> {
    if (hasShellOperators(command)) {
        return {
            success: false,
            output: "Error: Shell operators (chaining, piping, redirection) are strictly blocked by the security runtime. Use simple sequential commands instead."
        };
    }

    const tokens = tokenizeCommand(command);
    if (tokens.length === 0) {
        return { success: false, output: "Empty command." };
    }

    const cmd = tokens[0];
    const args = tokens.slice(1);

    if (!cmd) {
        return { success: false, output: "Empty command." };
    }

    return new Promise((resolve) => {
        try {
            const child = spawn(cmd, args, { cwd: process.cwd(), shell: false });
            let output = "";
            let errorOutput = "";

            if (child.stdout) {
                child.stdout.on("data", (data: any) => {
                    output += data.toString();
                });
            }

            if (child.stderr) {
                child.stderr.on("data", (data: any) => {
                    errorOutput += data.toString();
                });
            }

            child.on("error", (err: any) => {
                resolve({ success: false, output: `Error: ${err.message}` });
            });

            child.on("close", (code: number | null) => {
                const finalOutput = (output + "\n" + errorOutput).trim();
                resolve({
                    success: code === 0,
                    output: finalOutput || (code !== 0 ? `Command exited with code ${code}` : "Success")
                });
            });
        } catch (err: any) {
            resolve({ success: false, output: `Error: ${err.message}` });
        }
    });
}
