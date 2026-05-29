import fs from "fs";
import path from "path";

/**
 * Writes a file atomically using a temporary file and rename.
 * Includes Windows retry loop for antivirus locks.
 */
export async function writeAtomic(filePath: string, content: string | Buffer, options?: { mode?: number }): Promise<void> {
    const tmpPath = `${filePath}.tmp.${Math.random().toString(36).slice(2)}`;
    
    const fd = fs.openSync(tmpPath, "w", options?.mode);
    try {
        fs.writeFileSync(fd, content);
        fs.fsyncSync(fd);
    } finally {
        fs.closeSync(fd);
    }

    const maxRetries = 5;
    let attempts = 0;
    
    while (attempts < maxRetries) {
        try {
            fs.renameSync(tmpPath, filePath);
            return;
        } catch (err: any) {
            attempts++;
            if (attempts >= maxRetries) {
                try { fs.unlinkSync(tmpPath); } catch {}
                throw new Error(`Failed to rename atomic file after ${maxRetries} attempts: ${err.message}`);
            }
            await new Promise(r => setTimeout(r, 50 * attempts)); // Exponential backoff
        }
    }
}
