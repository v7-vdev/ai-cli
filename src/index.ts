#!/usr/bin/env node

import { renderApp } from "./ui/renderer/index.js";
import { runDoctor } from "./commands/doctor.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const args = process.argv.slice(2);

if (args.includes("--version") || args.includes("-v")) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const pkgPath = path.join(__dirname, "..", "package.json");
    try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        console.log(`ORK Orchestration Runtime v${pkg.version}`);
    } catch {
        console.log(`ORK Orchestration Runtime (Version Unknown)`);
    }
    process.exit(0);
}

if (args[0] === "doctor") {
    await runDoctor();
    process.exit(0);
}

const isDryRun = args.includes("--dry-run") || args.includes("--preview-only");

renderApp(isDryRun);
