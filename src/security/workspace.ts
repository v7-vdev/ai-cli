import fs from "fs";

let cachedRoot: string | null = null;

export function getWorkspaceRoot(): string {
    if (cachedRoot) return cachedRoot;
    try {
        cachedRoot = fs.realpathSync(process.cwd());
    } catch {
        cachedRoot = process.cwd();
    }
    return cachedRoot;
}
