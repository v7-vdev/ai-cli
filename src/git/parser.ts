/**
 * Parses the raw output of `git status --porcelain`.
 */
export function parsePorcelainStatus(stdout: string) {
    const modifiedFiles: string[] = [];
    const stagedFiles: string[] = [];
    const untrackedFiles: string[] = [];

    if (!stdout) {
        return { modifiedFiles, stagedFiles, untrackedFiles };
    }

    const lines = stdout.split('\n');
    for (const line of lines) {
        if (line.length < 3) continue;

        const x = line[0]; // Staged status
        const y = line[1]; // Unstaged status
        const file = line.substring(3).trim();

        // Check untracked files
        if (x === '?' && y === '?') {
            untrackedFiles.push(file);
            continue;
        }

        // Check staged changes
        if (x !== ' ' && x !== '?') {
            stagedFiles.push(file);
        }

        // Check unstaged (modified) changes
        if (y !== ' ' && y !== '?') {
            // Avoid duplicate pushing if we only want unique names, but git gives unique paths per line usually.
            modifiedFiles.push(file);
        }
    }

    return { modifiedFiles, stagedFiles, untrackedFiles };
}
