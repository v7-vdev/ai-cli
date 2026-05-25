import { exec } from "child_process";
import { promisify } from "util";
import { AuditLogger } from "../logs/auditLogger.js";

const execAsync = promisify(exec);

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
        await execAsync("git --version", { timeout: 2000, cwd: options.cwd });
        gitAvailableCache = true;
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
    const command = `git ${args.join(" ")}`;

    try {
        const result = await execAsync(command, {
            cwd: options.cwd,
            timeout,
            windowsHide: true
        });
        return {
            stdout: result.stdout.trim(),
            stderr: result.stderr.trim()
        };
    } catch (error: any) {
        options.logger?.log("WARN", "GIT", `Git command failed: ${command} - ${error.message}`);
        throw error;
    }
}
