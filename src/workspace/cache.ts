import { WorkspaceMetadata } from './metadata.js';

class WorkspaceCache {
    private cache: WorkspaceMetadata | null = null;
    private readonly TTL_MS = 1000 * 60 * 60; // 1 hour

    get(): WorkspaceMetadata | null {
        if (!this.cache) return null;
        if (Date.now() - this.cache.scanTimestamp > this.TTL_MS) {
            this.cache = null;
            return null;
        }
        return this.cache;
    }

    set(metadata: WorkspaceMetadata): void {
        this.cache = metadata;
    }

    invalidate(): void {
        this.cache = null;
    }
}

export const workspaceCache = new WorkspaceCache();
