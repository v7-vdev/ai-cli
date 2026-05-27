import { runCommand } from "../tools/runCommand.js";
import { AuditLogger } from "../logs/auditLogger.js";

// In-memory cache for git availability per session
let gitAvailableCache: boolean | null = null;

export interface GitExecOptions {
    cwd: string;
    timeoutMs?: number;
    logger?: AuditLogger;
}

/**
 * Checks if the 'git' command is available in the shell path.
 */
export async function isGitAvailable(options: GitExecOptions): Promise<boolean> {
    if (gitAvailableCache !== null) {
        return gitAvailableCache;
    }

    try {
        const result = await runCommand(["git", "--version"], { cwd: options.cwd, timeoutMs: 2000 });
        gitAvailableCache = result.success;
        if (!gitAvailableCache) {
            options.logger?.log("WARN", "GIT", "Git executable not found or inaccessible in environment.");
        }
    } catch {
        gitAvailableCache = false;
        options.logger?.log("WARN", "GIT", "Git executable not found or inaccessible in environment.");
    }
    
    return gitAvailableCache;
}

/**
 * Executes a Git command safely with timeouts and non-blocking boundaries.
 */
export async function execGit(args: string[], options: GitExecOptions): Promise<{ stdout: string; stderr: string }> {
    const available = await isGitAvailable(options);
    if (!available) {
        throw new Error("Git is not available in the current environment.");
    }

    const timeout = options.timeoutMs || 2000;
    const commandArray = ["git", ...args];
    const commandStr = `git ${args.join(" ")}`;

    try {
        const result = await runCommand(commandArray, {
            cwd: options.cwd,
            timeoutMs: timeout
        });
        
        if (!result.success) {
            options.logger?.log("WARN", "GIT", `Git command failed: ${commandStr} - ${result.stderr || result.output}`);
            throw new Error(result.stderr || result.output);
        }
        
        return {
            stdout: result.stdout.trim(),
            stderr: result.stderr.trim()
        };
    } catch (error: any) {
        options.logger?.log("WARN", "GIT", `Git command failed: ${commandStr} - ${error.message}`);
        throw error;
    }
}
