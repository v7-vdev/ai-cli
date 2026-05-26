import path from "path";

const BLOCKED_INTERPRETERS = new Set([
    "sh", "bash", "zsh", "cmd", "cmd.exe", "powershell", "pwsh",
    "node", "python", "python3", "ruby", "perl", "php", "ts-node"
]);

export function isIndirectExecution(command: string, modifiedFiles: Set<string>): string | null {
    const tokens = command.trim().split(/\s+/);
    if (tokens.length < 2) return null;

    const interpreter = tokens[0]?.toLowerCase();
    if (!interpreter) return null;
    
    if (BLOCKED_INTERPRETERS.has(interpreter)) {
        for (let i = 1; i < tokens.length; i++) {
            let targetPath = tokens[i];
            if (!targetPath) continue;
            
            // Normalize target path
            targetPath = targetPath.replace(/['"]/g, '');
            const targetBase = path.basename(targetPath);

            // Ignore flags
            if (targetPath.startsWith("-")) continue;

            for (const modified of modifiedFiles) {
                if (modified.endsWith(targetPath) || path.basename(modified) === targetBase) {
                    return `Indirect execution bypass blocked: Attempting to run interpreter '${interpreter}' on recently modified file '${targetBase}'.`;
                }
            }
        }
    }
    
    return null;
}
