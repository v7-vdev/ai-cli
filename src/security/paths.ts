import fs from "fs";
import path from "path";
import { getWorkspaceRoot } from "./workspace.js";

export function validateWorkspacePath(targetPath: string): string {
    const root = getWorkspaceRoot();
    
    // 1. Resolve to absolute path
    const absolutePath = path.resolve(root, targetPath);
    
    // Normalize path separators for strict comparison (Windows support)
    const normalizedRoot = root.toLowerCase();
    const normalizedAbsolute = absolutePath.toLowerCase();

    // 2. Verify literal path remains inside workspace boundary
    if (!normalizedAbsolute.startsWith(normalizedRoot)) {
        throw new Error("Path traversal blocked.");
    }

    // 3. Resolve symlinks using realpathSync if the file exists
    if (fs.existsSync(absolutePath)) {
        const realPath = fs.realpathSync(absolutePath);
        if (!realPath.toLowerCase().startsWith(normalizedRoot)) {
            throw new Error("Path traversal blocked: Symlink escape detected.");
        }
        return realPath;
    }
    
    // 4. For non-existent files, verify the parent directory
    const dir = path.dirname(absolutePath);
    if (fs.existsSync(dir)) {
        const realDir = fs.realpathSync(dir);
        if (!realDir.toLowerCase().startsWith(normalizedRoot)) {
            throw new Error("Path traversal blocked: Directory symlink escape detected.");
        }
    }

    return absolutePath;
}
