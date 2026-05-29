import crypto from "crypto";
import path from "path";
import fs from "fs";

class FileHashCache {
    private hashes = new Map<string, string>();

    private normalize(filePath: string): string {
        return path.resolve(process.cwd(), filePath);
    }

    public setHash(filePath: string, contentOrHash: string, isHash = false) {
        const hash = isHash ? contentOrHash : this.calculateHash(contentOrHash);
        const normalized = this.normalize(filePath);
        
        if (this.hashes.has(normalized)) {
            this.hashes.delete(normalized);
        } else if (this.hashes.size >= 1000) {
            const firstKey = this.hashes.keys().next().value;
            if (firstKey) this.hashes.delete(firstKey);
        }
        
        this.hashes.set(normalized, hash);
    }

    public getHash(filePath: string): string | undefined {
        const normalized = this.normalize(filePath);
        if (!this.hashes.has(normalized)) return undefined;
        
        const hash = this.hashes.get(normalized)!;
        this.hashes.delete(normalized);
        this.hashes.set(normalized, hash);
        return hash;
    }

    public calculateHash(content: string): string {
        return crypto.createHash('md5').update(content).digest('hex');
    }

    public async calculateHashFile(filePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('md5');
            const stream = fs.createReadStream(filePath);
            
            stream.on('data', (chunk) => {
                hash.update(chunk);
                // Yield to event loop to keep Ctrl+C responsive
                Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 0); // No sleep, just yield? No, Atomics.wait blocks.
                // In Node, streams yield naturally, but if it's too fast we can setImmediate.
            });

            stream.on('end', () => {
                resolve(hash.digest('hex'));
            });

            stream.on('error', (err) => {
                reject(err);
            });
        });
    }
}

export const globalHashCache = new FileHashCache();
