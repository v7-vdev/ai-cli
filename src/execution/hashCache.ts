import crypto from "crypto";
import path from "path";

class FileHashCache {
    private hashes = new Map<string, string>();

    private normalize(filePath: string): string {
        return path.resolve(process.cwd(), filePath);
    }

    public setHash(filePath: string, content: string) {
        const hash = this.calculateHash(content);
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
}

export const globalHashCache = new FileHashCache();
