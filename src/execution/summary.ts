class ExecutionSummary {
    private modifiedFiles: Set<string> = new Set();
    private commandsRun: number = 0;

    // Metrics
    public totalExecutionTimeMs: number = 0;
    public totalApprovalWaitTimeMs: number = 0;
    public totalDiffTimeMs: number = 0;
    public totalCommandTimeMs: number = 0;
    public cancellationCount: number = 0;
    public approvalCount: number = 0;
    public rejectionCount: number = 0;

    public addFileModification(filePath: string) {
        this.modifiedFiles.add(filePath);
    }

    public addCommandRun() {
        this.commandsRun++;
    }

    public getSummary(): string {
        return `Execution Summary: Modified ${this.modifiedFiles.size} files, executed ${this.commandsRun} command(s). Approvals: ${this.approvalCount}, Rejections: ${this.rejectionCount}, Cancellations: ${this.cancellationCount}.`;
    }
    
    public getModifiedFiles(): Set<string> {
        return this.modifiedFiles;
    }

    public clear() {
        this.modifiedFiles.clear();
        this.commandsRun = 0;
        this.totalExecutionTimeMs = 0;
        this.totalApprovalWaitTimeMs = 0;
        this.totalDiffTimeMs = 0;
        this.totalCommandTimeMs = 0;
        this.cancellationCount = 0;
        this.approvalCount = 0;
        this.rejectionCount = 0;
    }
}

export const globalExecutionSummary = new ExecutionSummary();
