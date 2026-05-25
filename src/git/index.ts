import { AuditLogger } from "../logs/auditLogger.js";
import { GitMetadata } from "./metadata.js";
import { isGitAvailable } from "./exec.js";
import { getCurrentBranch, getRepoRoot } from "./branch.js";
import { getRepoStatus } from "./status.js";

export type { GitMetadata } from "./metadata.js";

export class GitScanner {
    /**
     * Scans the given directory to detect repository metadata safely.
     * Guaranteed to be non-blocking with tight timeouts.
     */
    static async scan(cwd: string, logger: AuditLogger): Promise<GitMetadata> {
        const options = { cwd, timeoutMs: 2000, logger };
        
        try {
            const available = await isGitAvailable(options);
            if (!available) {
                return GitScanner.emptyState();
            }

            const repoRoot = await getRepoRoot(options);
            if (!repoRoot) {
                // Not a git repository
                return GitScanner.emptyState();
            }

            logger.log("INFO", "GIT", `Detected repository at: ${repoRoot}`);

            // Concurrent execution of branch and status checks
            const [branch, status] = await Promise.all([
                getCurrentBranch(options),
                getRepoStatus(options)
            ]);

            return {
                isRepo: true,
                repoRoot,
                branch: branch || "unknown",
                modifiedFiles: status.modifiedFiles,
                stagedFiles: status.stagedFiles,
                untrackedFiles: status.untrackedFiles,
                isDirty: status.isDirty
            };
        } catch (error: any) {
            logger.log("WARN", "GIT", `Git scan failed: ${error.message}`);
            return GitScanner.emptyState();
        }
    }

    private static emptyState(): GitMetadata {
        return {
            isRepo: false,
            branch: "",
            modifiedFiles: [],
            stagedFiles: [],
            untrackedFiles: [],
            isDirty: false
        };
    }
}
