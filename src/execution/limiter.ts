export class ExecutionLimiter {
    private maxConcurrent: number;
    private currentExecutions: number = 0;
    private queue: Array<() => void> = [];

    constructor(maxConcurrent: number = 5) {
        this.maxConcurrent = maxConcurrent;
    }

    public async acquire(): Promise<void> {
        if (this.currentExecutions < this.maxConcurrent) {
            this.currentExecutions++;
            return Promise.resolve();
        }

        return new Promise<void>((resolve) => {
            this.queue.push(resolve);
        });
    }

    public release(): void {
        if (this.queue.length > 0) {
            const next = this.queue.shift();
            if (next) {
                next();
            }
        } else {
            this.currentExecutions--;
            if (this.currentExecutions < 0) this.currentExecutions = 0;
        }
    }
}

export const globalLimiter = new ExecutionLimiter(5);
