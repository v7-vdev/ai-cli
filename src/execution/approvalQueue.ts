export class ApprovalQueue {
    private queue: { task: () => Promise<void>, abort: (reason: string) => void }[] = [];
    private isProcessing = false;
    private activeAbort?: ((reason: string) => void) | undefined;

    public enqueue(task: () => Promise<void>, abort: (reason: string) => void) {
        this.queue.push({ task, abort });
        this.processNext();
    }

    public abortAll(reason: string) {
        const pending = [...this.queue];
        this.queue = [];
        this.isProcessing = false;
        
        if (this.activeAbort) {
            this.activeAbort(reason);
            this.activeAbort = undefined;
        }

        for (const item of pending) {
            item.abort(reason);
        }
    }

    private async processNext() {
        if (this.isProcessing || this.queue.length === 0) return;
        this.isProcessing = true;
        
        const item = this.queue.shift();
        if (item) {
            let resolveAbort: () => void;
            const abortPromise = new Promise<void>((resolve) => {
                resolveAbort = resolve;
            });

            this.activeAbort = (reason: string) => {
                item.abort(reason);
                resolveAbort(); // Unblock the running task internally
            };

            try {
                await Promise.race([item.task(), abortPromise]);
            } finally {
                this.activeAbort = undefined;
                this.isProcessing = false;
                setTimeout(() => this.processNext(), 0);
            }
        }
    }
}
