export interface GitMetadata {
    isRepo: boolean;
    repoRoot?: string;
    branch: string;
    modifiedFiles: string[];
    stagedFiles: string[];
    untrackedFiles: string[];
    isDirty: boolean;
}
