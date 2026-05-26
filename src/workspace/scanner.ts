import * as fs from 'fs';
import * as path from 'path';
import { WorkspaceMetadata } from './metadata.js';
import { detectFrameworks, detectPackageManager } from './detector.js';
import { workspaceCache } from './cache.js';

const IGNORED_DIRS = new Set(['node_modules', 'dist', 'build', '.git', 'coverage', '.next', '.ork']);
const MAX_SCAN_DEPTH = 3;
const MAX_SCAN_TIME_MS = 5000;

export class WorkspaceScanner {
    static async scan(cwd: string, logger?: any): Promise<WorkspaceMetadata> {
        const cached = workspaceCache.get();
        if (cached) return cached;

        const startTime = Date.now();
        if (logger) logger.log("INFO", "WORKSPACE", `Starting workspace scan at ${cwd}`);

        let scannedCount = 0;
        const importantFiles: string[] = [];
        const importantFolders: string[] = [];
        const rootFiles: string[] = [];

        let timeoutId: any;
        // Promise to handle the timeout gracefully
        const timeoutPromise = new Promise<WorkspaceMetadata>((resolve) => {
            timeoutId = setTimeout(() => {
                if (logger) logger.log("WARN", "WORKSPACE", `Scan timed out after ${MAX_SCAN_TIME_MS}ms. Returning partial metadata.`);
                resolve({
                    projectName: path.basename(cwd),
                    projectRoot: cwd,
                    frameworks: [],
                    packageManager: 'unknown',
                    importantFiles,
                    importantFolders,
                    scannedFilesCount: scannedCount,
                    scanDurationMs: Date.now() - startTime,
                    scanTimestamp: Date.now()
                });
            }, MAX_SCAN_TIME_MS);
        });

        const scanPromise = new Promise<WorkspaceMetadata>(async (resolve) => {
            // Read root directory for heuristic detection
            try {
                const rootEntries = await fs.promises.readdir(cwd, { withFileTypes: true });
                for (const entry of rootEntries) {
                    if (entry.isFile()) {
                        rootFiles.push(entry.name);
                        if (entry.name === 'package.json' || entry.name.includes('config')) {
                            importantFiles.push(entry.name);
                        }
                    } else if (entry.isDirectory() && !IGNORED_DIRS.has(entry.name)) {
                        importantFolders.push(entry.name);
                    }
                }

                // Parse package.json if it exists
                let packageJson = null;
                let projectName = path.basename(cwd);
                if (rootFiles.includes('package.json')) {
                    try {
                        const content = await fs.promises.readFile(path.join(cwd, 'package.json'), 'utf-8');
                        packageJson = JSON.parse(content);
                        if (packageJson.name) {
                            projectName = packageJson.name;
                        }
                    } catch (e) {}
                }

                const frameworks = detectFrameworks(packageJson, rootFiles);
                const packageManager = detectPackageManager(rootFiles);

                // Very lightweight recursive scan to count files (non-blocking chunked)
                async function recursiveScan(dir: string, depth: number) {
                    if (depth > MAX_SCAN_DEPTH || Date.now() - startTime > MAX_SCAN_TIME_MS - 500) return;
                    try {
                        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
                        for (const entry of entries) {
                            if (IGNORED_DIRS.has(entry.name)) continue;
                            if (entry.isDirectory()) {
                                await recursiveScan(path.join(dir, entry.name), depth + 1);
                            } else {
                                scannedCount++;
                            }
                        }
                    } catch (e) {}
                }

                await recursiveScan(cwd, 0);

                const scanDurationMs = Date.now() - startTime;
                if (logger) logger.log("INFO", "WORKSPACE", `Scan completed in ${scanDurationMs}ms. Found ${scannedCount} files, ${frameworks.length} frameworks.`);

                resolve({
                    projectName,
                    projectRoot: cwd,
                    frameworks,
                    packageManager,
                    importantFiles,
                    importantFolders,
                    scannedFilesCount: scannedCount,
                    scanDurationMs,
                    scanTimestamp: Date.now()
                });
            } catch (error: any) {
                if (logger) logger.log("ERROR", "WORKSPACE", `Scan failed: ${error.message}`);
                resolve({
                    projectName: path.basename(cwd),
                    projectRoot: cwd,
                    frameworks: [],
                    packageManager: 'unknown',
                    importantFiles: [],
                    importantFolders: [],
                    scannedFilesCount: 0,
                    scanDurationMs: Date.now() - startTime,
                    scanTimestamp: Date.now()
                });
            }
        });

        const metadata = await Promise.race([scanPromise, timeoutPromise]);
        clearTimeout(timeoutId);
        workspaceCache.set(metadata);
        return metadata;
    }
}
