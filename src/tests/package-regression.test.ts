import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..', '..');

test('Packaged Runtime Regression - Check if Windows exe exists or skips', async (t) => {
    // Only run this test if the binary has been built in release
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf-8'));
    const releaseDir = path.join(ROOT_DIR, 'release');
    const exeName = `ork-v${pkg.version}-windows-x64.exe`;
    const exePath = path.join(releaseDir, exeName);

    if (!fs.existsSync(exePath)) {
        t.skip('Packaged binary not found. Skipping packaged runtime regression.');
        return;
    }

    try {
        // Run with --version to verify startup integrity and path resolution
        const output = execSync(`"${exePath}" --version`, { encoding: 'utf-8' });
        assert.ok(output.includes(`ORK Orchestration Runtime v${pkg.version}`), 'Packaged runtime should boot and print version exactly like node source.');
    } catch (e: any) {
        assert.fail(`Packaged runtime failed to execute: ${e.message}`);
    }
});
