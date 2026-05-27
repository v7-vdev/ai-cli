import fs from 'fs';
import path from 'path';

/**
 * Writes data atomically to a file to prevent partial-write corruption.
 * It writes to a temporary file in the same directory, flushes it to disk,
 * and atomically renames it over the target file.
 */
export function writeAtomicSync(targetPath: string, data: string | Buffer, options?: fs.WriteFileOptions): void {
    const tmpPath = `${targetPath}.tmp.${Date.now()}`;
    
    let fd: number | null = null;
    try {
        // Open file explicitly for writing
        fd = fs.openSync(tmpPath, 'w', typeof options === 'object' && options.mode ? options.mode : 0o666);
        fs.writeSync(fd, data);
        
        // Force flush to disk to prevent power-loss corruption
        fs.fsyncSync(fd);
    } finally {
        if (fd !== null) {
            fs.closeSync(fd);
        }
    }

    // Atomic rename loop for Windows lock contention
    const maxRetries = 5;
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            fs.renameSync(tmpPath, targetPath);
            return; // Success
        } catch (err: any) {
            // EPERM/EACCES usually means antivirus is scanning the new file on Windows
            if (err.code === 'EPERM' || err.code === 'EACCES') {
                attempt++;
                if (attempt >= maxRetries) {
                    try { fs.unlinkSync(tmpPath); } catch {}
                    throw err; // Give up
                }
                // Busy wait fallback (since this is sync)
                const start = Date.now();
                while (Date.now() - start < 50) { /* block */ }
            } else {
                try { fs.unlinkSync(tmpPath); } catch {}
                throw err;
            }
        }
    }
}
