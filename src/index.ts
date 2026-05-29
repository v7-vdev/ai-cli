#!/usr/bin/env node

import { renderApp } from "./ui/renderer/index.js";
import { runDoctor } from "./commands/doctor.js";
import { runInit } from "./commands/init.js";
import { MigrationManager } from "./security/migration.js";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

// Deterministic configuration migration (MUST RUN FIRST)
try {
    MigrationManager.runMigration();
} catch (e: any) {
    console.error(`\n[ORK STARTUP ERROR] Migration failed: ${e.message}`);
    console.error(`Please run 'ork init' to repair your configuration or check ~/.ork directories.`);
    process.exit(1);
}

// Setup deterministic crash logging
const logsDir = path.join(os.homedir(), ".ork", "logs");
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true, mode: 0o700 });
}

import { redactSecrets } from "./security/secrets.js";

function emergencyRestore() {
    try {
        process.stdout.write("\x1B[?25h"); // Show cursor
        process.stdout.write("\x1B[0m");   // Reset formatting
        process.stdout.write("\x1B[?1049l"); // Exit alternate screen
    } catch {}
}

function writeCrashLog(err: Error, type: string) {
    emergencyRestore();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const logPath = path.join(logsDir, `crash-${timestamp}.log`);
    const content = redactSecrets(
        `ORK CRASH LOG - ${type}\n` +
        `Timestamp: ${new Date().toISOString()}\n` +
        `Error: ${err.message}\n` +
        `Stack: ${err.stack}\n`
    );
    try { fs.writeFileSync(logPath, content); } catch {}
    console.error(`\n[ORK PANIC] A critical error occurred. Trace written to: ${logPath}`);
    process.exit(1);
}

process.on("uncaughtException", (err) => writeCrashLog(err, "uncaughtException"));
process.on("unhandledRejection", (reason) => {
    writeCrashLog(reason instanceof Error ? reason : new Error(String(reason)), "unhandledRejection");
});
process.on("exit", emergencyRestore);
process.on("SIGINT", () => { emergencyRestore(); process.exit(130); });
process.on("SIGTERM", () => { emergencyRestore(); process.exit(143); });

const args = process.argv.slice(2);

if (args.includes("--version") || args.includes("-v")) {
    try {
        const pkgPath = fileURLToPath(new URL("../package.json", import.meta.url));
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        console.log(`ORK Orchestration Runtime v${pkg.version}`);
    } catch (e) {
        console.log("ORK Orchestration Runtime (Version unknown)");
    }
    process.exit(0);
}

if (args[0] === "doctor") {
    await runDoctor();
    process.exit(0);
}

if (args[0] === "init") {
    await runInit();
    process.exit(0);
}

const isDryRun = args.includes("--dry-run") || args.includes("--preview-only");
const isAudit = args.includes("--audit");

if (isAudit) {
    import("./utils/profiler.js").then(({ RuntimeProfiler }) => {
        process.on("exit", () => {
            RuntimeProfiler.writeHeapSnapshot();
            RuntimeProfiler.auditActiveHandles();
        });
    });
}

try {
    renderApp(isDryRun);
} catch (e: any) {
    console.error(`\n[ORK RUNTIME ERROR] Failed to boot orchestration runtime: ${e.message}`);
    console.error(`This may be due to a corrupted keys.json or missing dependencies. Try running 'ork doctor' or 'ork init'.`);
    process.exit(1);
}
