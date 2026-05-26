import fs from "fs";
import path from "path";

export type LogLevel = "INFO" | "WARN" | "ERROR" | "SECURITY";

export class AuditLogger {
    private logFilePath: string;
    private maxSizeBytes: number;
    private isWriting: boolean = false;
    private writeQueue: string[] = [];
    private lastLogMap: Map<string, { timestamp: number; count: number }> = new Map();
    private readonly DUPLICATE_SPAM_WINDOW_MS = 2000;
    private readonly MAX_DUPLICATES = 3;

    constructor(maxSizeBytes: number = 2 * 1024 * 1024) { // default 2MB
        this.maxSizeBytes = maxSizeBytes;
        
        const logDir = path.join(process.cwd(), ".ai-cli");
        if (!fs.existsSync(logDir)) {
            try {
                fs.mkdirSync(logDir, { recursive: true });
            } catch (err) {
                // Ignore if we can't create dir, we'll fail silently in production
            }
        }
        
        this.logFilePath = path.join(logDir, "audit.log");
        this.rotateLogsIfNeededSync();
    }

    private rotateLogsIfNeededSync() {
        try {
            if (fs.existsSync(this.logFilePath)) {
                const stats = fs.statSync(this.logFilePath);
                if (stats.size >= this.maxSizeBytes) {
                    const backupPath = `${this.logFilePath}.old`;
                    if (fs.existsSync(backupPath)) {
                        fs.unlinkSync(backupPath);
                    }
                    fs.renameSync(this.logFilePath, backupPath);
                }
            }
        } catch (e) {
            // fail silently to prevent crashing REPL
        }
    }

    private redact(message: string): string {
        let redacted = message;
        redacted = redacted.replace(/(sk-[a-zA-Z0-9]{20,})/g, "[REDACTED_API_KEY]");
        redacted = redacted.replace(/(gsk_[a-zA-Z0-9]{20,})/g, "[REDACTED_API_KEY]");
        return redacted;
    }

    public log(level: LogLevel, context: string, message: string, executionId?: string) {
        try {
            const redactedMessage = this.redact(message);
            const duplicateKey = `${level}:${context}:${redactedMessage}`;
            
            const now = Date.now();
            const lastLog = this.lastLogMap.get(duplicateKey);
            
            if (lastLog && (now - lastLog.timestamp) < this.DUPLICATE_SPAM_WINDOW_MS) {
                lastLog.count++;
                if (lastLog.count > this.MAX_DUPLICATES) {
                    return; // Drop spam
                }
            } else {
                this.lastLogMap.set(duplicateKey, { timestamp: now, count: 1 });
            }

            if (this.lastLogMap.size > 100) {
                const threshold = now - this.DUPLICATE_SPAM_WINDOW_MS;
                for (const [k, v] of this.lastLogMap.entries()) {
                    if (v.timestamp < threshold) {
                        this.lastLogMap.delete(k);
                    }
                }
            }

            const timestampStr = new Date().toISOString();
            const execIdStr = executionId ? `[${executionId}] ` : "";
            const logEntry = `[${timestampStr}] [${level}] [${context}] ${execIdStr}${redactedMessage}\n`;
            
            this.writeQueue.push(logEntry);
            this.processQueue();
        } catch (e) {
            // prevent recursive logging loops or crashes
        }
    }

    private async processQueue() {
        if (this.isWriting || this.writeQueue.length === 0) return;
        this.isWriting = true;

        try {
            const entries = [...this.writeQueue];
            this.writeQueue = [];
            const data = entries.join("");
            
            await fs.promises.appendFile(this.logFilePath, data, { encoding: "utf8", flag: "a" });
        } catch (err) {
            // fail silently
        } finally {
            this.isWriting = false;
            // recursively process remaining items if any
            if (this.writeQueue.length > 0) {
                setTimeout(() => this.processQueue(), 0);
            }
        }
    }

    public getLogFilePath(): string {
        return this.logFilePath;
    }
}
