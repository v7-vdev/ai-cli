export interface FrameworkDetection {
    name: string;
    type: 'frontend' | 'backend' | 'fullstack' | 'database' | 'language' | 'tooling';
}

export interface WorkspaceMetadata {
    projectName: string;
    projectRoot: string;
    frameworks: FrameworkDetection[];
    packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun' | 'unknown';
    importantFiles: string[];
    importantFolders: string[];
    scannedFilesCount: number;
    scanDurationMs: number;
    scanTimestamp: number;
}
