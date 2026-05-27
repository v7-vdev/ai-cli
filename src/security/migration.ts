import fs from "fs";
import path from "path";
import os from "os";
import chalk from "chalk";

const LEGACY_DIR = path.join(os.homedir(), ".ai-cli");
const BACKUP_DIR = path.join(os.homedir(), ".ai-cli.backup");
const ORK_DIR = path.join(os.homedir(), ".ork");

export class MigrationManager {
    public static runMigration() {
        if (!fs.existsSync(LEGACY_DIR) || fs.existsSync(ORK_DIR)) {
            // Either no legacy config to migrate, or already migrated.
            return;
        }

        console.log(chalk.blue("ℹ") + chalk.dim(" Executing deterministic ORK configuration migration..."));

        try {
            // 1. Create target ORK dir safely
            fs.mkdirSync(ORK_DIR, { recursive: true, mode: 0o700 });

            // 2. Safely copy keys and verify integrity
            const masterKeyPath = path.join(LEGACY_DIR, "master.key");
            const keysPath = path.join(LEGACY_DIR, "keys.json");
            const historyPath = path.join(LEGACY_DIR, "history.json");
            const configPath = path.join(LEGACY_DIR, "config.json");

            if (fs.existsSync(masterKeyPath)) {
                fs.copyFileSync(masterKeyPath, path.join(ORK_DIR, "master.key"));
                // Integrity check: verify it exists and size > 0 in destination
                const stat = fs.statSync(path.join(ORK_DIR, "master.key"));
                if (stat.size === 0) throw new Error("Corruption detected: master.key is empty.");
            }

            if (fs.existsSync(keysPath)) {
                fs.copyFileSync(keysPath, path.join(ORK_DIR, "keys.json"));
            }

            if (fs.existsSync(historyPath)) {
                fs.copyFileSync(historyPath, path.join(ORK_DIR, "history.json"));
            }

            if (fs.existsSync(configPath)) {
                fs.copyFileSync(configPath, path.join(ORK_DIR, "config.json"));
            }

            // 3. Rollback safety: move legacy directory to backup instead of deleting
            if (fs.existsSync(BACKUP_DIR)) {
                fs.rmSync(BACKUP_DIR, { recursive: true, force: true });
            }
            fs.renameSync(LEGACY_DIR, BACKUP_DIR);

            console.log(chalk.green("✔") + chalk.dim(" Migration to ~/.ork completed safely. Legacy config backed up to ~/.ai-cli.backup"));
        } catch (e: any) {
            console.error(chalk.red("✖") + chalk.dim(` Migration failed: ${e.message}`));
            console.error(chalk.yellow("⚠") + chalk.dim(" Rolling back partial migration to preserve state..."));
            // Attempt rollback of ~/.ork if it was partially created
            try {
                if (fs.existsSync(ORK_DIR)) {
                    fs.rmSync(ORK_DIR, { recursive: true, force: true });
                }
            } catch (rollbackErr) {
                // Ignore rollback errors, we at least didn't touch the source
            }
            console.error(chalk.yellow("⚠") + chalk.dim(" Legacy config remains untouched. Boot sequence proceeding cautiously."));
        }
    }
}
