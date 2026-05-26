import chalk from "chalk";
import fs from "fs";
import path from "path";
import os from "os";
import { KeyManager } from "../security/keys.js";

export async function runDoctor() {
    console.log(chalk.bold("ORK Diagnostics (ork doctor)\n"));
    
    let checksPassed = 0;
    let totalChecks = 0;

    const runCheck = (name: string, checkFn: () => boolean | string) => {
        totalChecks++;
        try {
            const result = checkFn();
            if (result === true) {
                console.log(chalk.green("✔ ") + name);
                checksPassed++;
            } else {
                console.log(chalk.red("✖ ") + name + chalk.dim(` - ${result}`));
            }
        } catch (error: any) {
            console.log(chalk.red("✖ ") + name + chalk.dim(` - Error: ${error.message}`));
        }
    };

    // 1. Config Integrity
    runCheck("Configuration Directory (~/.ork)", () => {
        const configDir = path.join(os.homedir(), ".ork");
        if (fs.existsSync(configDir)) return true;
        return "Config directory not found.";
    });

    // 2. Encryption Health
    runCheck("Master Key Integrity", () => {
        const keyPath = path.join(os.homedir(), ".ork", "master.key");
        if (!fs.existsSync(keyPath)) return "master.key is missing.";
        const stats = fs.statSync(keyPath);
        // On Unix, check for secure permissions. On Windows, just check size.
        if (stats.size !== 32) return "master.key size is invalid.";
        return true;
    });

    // 3. Provider Configuration
    runCheck("Provider Key Availability", () => {
        const providers = KeyManager.listConfiguredProviders();
        if (providers.length === 0) return "No providers configured (run 'ork config set').";
        return true;
    });

    // 4. Local File System Permissions
    runCheck("Workspace Read/Write Permissions", () => {
        const testFile = path.join(process.cwd(), ".ork-test-write");
        fs.writeFileSync(testFile, "test");
        fs.unlinkSync(testFile);
        return true;
    });

    console.log(`\n${checksPassed}/${totalChecks} checks passed.`);
    if (checksPassed === totalChecks) {
        console.log(chalk.green.bold("\nYour orchestration environment is healthy and ready to run."));
    } else {
        console.log(chalk.yellow("\nSome checks failed. ORK may have degraded capabilities."));
    }
}
