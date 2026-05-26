import path from "path";
import fs from "fs";

const PROTECTED_PATTERNS = [
    /^\.git([\\/].*)?$/,
    /^node_modules([\\/].*)?$/,
    /^\.env(\..+)?$/,
    /^package-lock\.json$/,
    /^pnpm-lock\.yaml$/,
    /^yarn\.lock$/,
    /^\.ai-cli([\\/].*)?$/,
    /credentials\.json$/,
    /secret/i
];

export interface ProtectedPathResult {
    isProtected: boolean;
    reason?: string;
}

export function isProtectedPath(filePath: string, cwd: string = process.cwd()): ProtectedPathResult {
    let absolutePath = path.resolve(cwd, filePath);
    
    try {
        if (fs.existsSync(absolutePath)) {
            absolutePath = fs.realpathSync(absolutePath);
        } else {
            const dir = path.dirname(absolutePath);
            if (fs.existsSync(dir)) {
                absolutePath = path.join(fs.realpathSync(dir), path.basename(absolutePath));
            }
        }
    } catch {
        // Fallback to resolved absolute path
    }

    const realCwd = fs.existsSync(cwd) ? fs.realpathSync(cwd) : cwd;
    
    if (!absolutePath.startsWith(realCwd)) {
        return { isProtected: true, reason: "Path escapes workspace boundary." };
    }

    const relativePath = path.relative(realCwd, absolutePath);
    const normalizedPath = relativePath.replace(/\\/g, '/');

    if (normalizedPath.startsWith('..')) {
        return { isProtected: true, reason: "Path traversal escape detected." };
    }

    for (const pattern of PROTECTED_PATTERNS) {
        if (pattern.test(normalizedPath)) {
            return { isProtected: true, reason: "Modifying protected configuration or system file." };
        }
    }
    
    return { isProtected: false };
}
