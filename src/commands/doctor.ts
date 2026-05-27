import os from "os";
import fs from "fs";
import path from "path";
import chalk from "chalk";
import { KeyManager } from "../security/keys.js";
import { ProviderRegistry } from "../providers/registry.js";

export async function runDoctor() {
    console.log(chalk.bold("ORK Diagnostics & Health Check\n"));
    
    let allPassed = true;

    const check = (name: string, fn: () => boolean | Promise<boolean>) => {
        try {
            const passed = fn();
            if (passed) {
                console.log(chalk.green("✔") + ` ${name}`);
            } else {
                console.log(chalk.red("✖") + ` ${name}`);
                allPassed = false;
            }
        } catch (e: any) {
            console.log(chalk.red("✖") + ` ${name} ` + chalk.dim(`(${e.message})`));
            allPassed = false;
        }
    };

    // 1. Filesystem & Configuration Boundaries
    check("Config directory (~/.ork) accessible", () => {
        const dir = path.join(os.homedir(), ".ork");
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.accessSync(dir, fs.constants.R_OK | fs.constants.W_OK);
        return true;
    });

    check("Logs directory (~/.ork/logs) writable", () => {
        const logsDir = path.join(os.homedir(), ".ork", "logs");
        if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
        const testFile = path.join(logsDir, ".test");
        fs.writeFileSync(testFile, "test");
        fs.unlinkSync(testFile);
        return true;
    });

    // 2. Encryption & Keys
    check("Master key initialized", () => {
        const keyPath = path.join(os.homedir(), ".ork", "master.key");
        return fs.existsSync(keyPath);
    });

    // 3. Provider Readiness
    check("At least one provider configured", () => {
        const providers = KeyManager.listConfiguredProviders();
        return providers.length > 0;
    });

    // 4. Terminal Compatibility
    check("Terminal capabilities verified", () => {
        const cols = process.stdout.columns;
        const rows = process.stdout.rows;
        if (!cols || !rows) {
            console.log(chalk.yellow("  ⚠ Terminal dimensions unknown (headless or non-interactive env)"));
        } else {
            console.log(chalk.dim(`  ↳ Dimensions: ${cols}x${rows}`));
        }
        return true; 
    });

    console.log("");
    if (allPassed) {
        console.log(chalk.green("✔ Runtime is healthy and ready for orchestration."));
    } else {
        console.log(chalk.red("✖ Runtime issues detected. Please fix the above errors."));
    }
}
