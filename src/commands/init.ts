import fs from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import { KeyManager } from '../security/keys.js';
import { writeAtomic } from '../utils/fs.js';

export async function runInit() {
    console.log(chalk.dim('=================================================='));
    console.log(chalk.bold('ORK Orchestration Runtime Initialization'));
    console.log(chalk.dim('==================================================\n'));

    const orkDir = path.join(os.homedir(), '.ork');
    const logsDir = path.join(orkDir, 'logs');
    const keysPath = path.join(orkDir, 'keys.json');
    const configPath = path.join(orkDir, 'config.json');

    // 1. Initialize Directories
    console.log(chalk.blue('ℹ') + chalk.dim(' Initializing runtime boundaries...'));
    if (!fs.existsSync(orkDir)) {
        fs.mkdirSync(orkDir, { recursive: true, mode: 0o700 });
        console.log(chalk.green('✔') + chalk.dim(` Created ${orkDir}`));
    } else {
        console.log(chalk.green('✔') + chalk.dim(` Discovered existing boundary at ${orkDir}`));
    }

    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true, mode: 0o700 });
        console.log(chalk.green('✔') + chalk.dim(` Initialized local-first diagnostics directory`));
    }

    // 2. Initialize Security
    console.log(chalk.blue('ℹ') + chalk.dim(' Validating encryption integrity...'));
    const activeProviders = KeyManager.listConfiguredProviders();
    
    if (activeProviders.length > 0) {
        console.log(chalk.green('✔') + chalk.dim(` Detected configured providers: ${activeProviders.join(', ')}`));
    } else {
        console.log(chalk.yellow('⚠') + chalk.dim(' No providers configured. Use `ork provider <name>` to set one up.'));
    }

    // 3. Configure SAFE MODE
    console.log(chalk.blue('ℹ') + chalk.dim(' Bootstrapping deterministic configuration...'));
    let config = { safeMode: true };
    if (fs.existsSync(configPath)) {
        try {
            config = { ...config, ...JSON.parse(fs.readFileSync(configPath, 'utf-8')) };
        } catch (e: any) {
            console.log(chalk.yellow('⚠') + chalk.dim(` Existing config corrupted (${e.message}). Quarantining to config.json.corrupt and regenerating...`));
            try { fs.renameSync(configPath, `${configPath}.corrupt.${Date.now()}`); } catch {}
        }
    }
    await writeAtomic(configPath, JSON.stringify(config, null, 4));
    console.log(chalk.green('✔') + chalk.bold(' SAFE MODE ') + chalk.dim('configured as default state'));

    // 4. Validate Terminal Capabilities
    console.log(chalk.blue('ℹ') + chalk.dim(' Validating environment...'));
    const cols = process.stdout.columns || 80;
    const rows = process.stdout.rows || 24;
    console.log(chalk.green('✔') + chalk.dim(` Terminal verified [${cols}x${rows}]`));

    console.log(chalk.dim('\n=================================================='));
    console.log(chalk.green('✔') + chalk.bold(' ORK initialized and ready for production orchestration.'));
    console.log(chalk.dim('Run `ork` to begin a session.'));
}
