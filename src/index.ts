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
MigrationManager.runMigration();

// Setup deterministic crash logging
const logsDir = path.join(os.homedir(), ".ork", "logs");
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true, mode: 0o700 });
}

function writeCrashLog(err: Error, type: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const logPath = path.join(logsDir, `crash-${timestamp}.log`);
    const content = `ORK CRASH LOG - ${type}\n` +
                    `Timestamp: ${new Date().toISOString()}\n` +
                    `Error: ${err.message}\n` +
                    `Stack: ${err.stack}\n`;
    fs.writeFileSync(logPath, content);
    console.error(`\n[ORK PANIC] A critical error occurred. Trace written to: ${logPath}`);
    process.exit(1);
}

process.on("uncaughtException", (err) => writeCrashLog(err, "uncaughtException"));
process.on("unhandledRejection", (reason) => {
    writeCrashLog(reason instanceof Error ? reason : new Error(String(reason)), "unhandledRejection");
});

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

renderApp(isDryRun);
