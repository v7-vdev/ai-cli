import { execGit, GitExecOptions } from "./exec.js";
import { parsePorcelainStatus } from "./parser.js";

export interface RepoStatus {
    modifiedFiles: string[];
    stagedFiles: string[];
    untrackedFiles: string[];
    isDirty: boolean;
}

export async function getRepoStatus(options: GitExecOptions): Promise<RepoStatus> {
    try {
        const { stdout } = await execGit(["status", "--porcelain"], options);
        const { modifiedFiles, stagedFiles, untrackedFiles } = parsePorcelainStatus(stdout);
        
        const isDirty = modifiedFiles.length > 0 || stagedFiles.length > 0 || untrackedFiles.length > 0;

        return {
            modifiedFiles,
            stagedFiles,
            untrackedFiles,
            isDirty
        };
    } catch {
        return {
            modifiedFiles: [],
            stagedFiles: [],
            untrackedFiles: [],
            isDirty: false
        };
    }
}
