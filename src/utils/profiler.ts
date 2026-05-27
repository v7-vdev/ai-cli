import v8 from "v8";
import path from "path";
import os from "os";
import fs from "fs";
import chalk from "chalk";

const LOGS_DIR = path.join(os.homedir(), ".ork", "logs");

export class RuntimeProfiler {
    public static writeHeapSnapshot() {
        if (!fs.existsSync(LOGS_DIR)) {
            fs.mkdirSync(LOGS_DIR, { recursive: true });
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const snapPath = path.join(LOGS_DIR, `heap-${timestamp}.heapsnapshot`);
        try {
            v8.writeHeapSnapshot(snapPath);
            console.log(chalk.dim(`\n[Audit] Wrote heap snapshot to: ${snapPath}`));
        } catch (e: any) {
            console.error(chalk.yellow(`\n[Audit] Failed to write heap snapshot: ${e.message}`));
        }
    }

    public static auditActiveHandles() {
        console.log(chalk.bold("\n[ORK Runtime Audit] Active Handles"));
        
        // Feature detect undocumented _getActiveHandles API
        const getHandles = (process as any)._getActiveHandles;
        if (typeof getHandles !== "function") {
            console.log(chalk.yellow("  ⚠ Active handle introspection not supported in this Node environment."));
            return;
        }

        const handles = getHandles();
        if (!handles || !Array.isArray(handles)) {
            console.log(chalk.dim("  No active handles detected."));
            return;
        }

        const categories = {
            Timers: 0,
            Sockets: 0,
            Streams: 0,
            ChildProcesses: 0,
            Other: 0
        };

        for (const h of handles) {
            if (!h) continue;
            const type = h.constructor?.name || typeof h;
            if (type.includes("Timeout") || type.includes("Timer")) {
                categories.Timers++;
            } else if (type.includes("Socket")) {
                categories.Sockets++;
            } else if (type.includes("Stream") || type.includes("TTY") || type.includes("Pipe")) {
                categories.Streams++;
            } else if (type.includes("ChildProcess") || type.includes("Process")) {
                categories.ChildProcesses++;
            } else {
                categories.Other++;
            }
        }

        let total = 0;
        for (const [key, val] of Object.entries(categories)) {
            if (val > 0) {
                console.log(chalk.dim(`  ↳ ${key}: `) + chalk.yellow(val));
                total += val;
            }
        }
        
        if (total === 0) {
            console.log(chalk.green("  ✔ Zero orphaned handles detected."));
        } else {
            console.log(chalk.yellow(`\n  ⚠ Detected ${total} lingering handles that prevented strict teardown.`));
        }
    }
}
