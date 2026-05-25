import { execGit, GitExecOptions } from "./exec.js";

export async function getCurrentBranch(options: GitExecOptions): Promise<string | null> {
    try {
        const { stdout } = await execGit(["branch", "--show-current"], options);
        return stdout || null;
    } catch {
        return null;
    }
}

export async function getRepoRoot(options: GitExecOptions): Promise<string | null> {
    try {
        // Use resolve to get absolute path from git root
        const { stdout } = await execGit(["rev-parse", "--show-toplevel"], options);
        return stdout || null;
    } catch {
        return null;
    }
}
