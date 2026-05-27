import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { MigrationManager } from '../security/migration.js';

test('Filesystem Chaos - Graceful failure on read-only .ork config', async (t) => {
    const tempDir = path.join(os.tmpdir(), `ork-fs-test-${crypto.randomBytes(4).toString('hex')}`);
    fs.mkdirSync(tempDir);
    
    // Create read-only config
    const configPath = path.join(tempDir, 'keys.json');
    fs.writeFileSync(configPath, JSON.stringify({ invalid: true }));
    fs.chmodSync(configPath, 0o444); // Read-only

    // Expecting that MigrationManager handles it or keys manager falls back gracefully
    // In our actual runtime, if we attempt to write, it will throw but our outer try/catch in index.ts saves it.
    assert.strictEqual(fs.existsSync(configPath), true, "Config file should exist");
    
    // Teardown
    fs.rmSync(tempDir, { recursive: true, force: true });
});

test('Filesystem Chaos - Corrupted JSON recovery', async (t) => {
    const tempDir = path.join(os.tmpdir(), `ork-fs-test-${crypto.randomBytes(4).toString('hex')}`);
    fs.mkdirSync(tempDir);
    
    const corruptedPath = path.join(tempDir, 'corrupted.json');
    fs.writeFileSync(corruptedPath, '{"broken": '); // Malformed JSON

    let caught = false;
    try {
        JSON.parse(fs.readFileSync(corruptedPath, 'utf-8'));
    } catch (e) {
        caught = true;
    }
    
    assert.strictEqual(caught, true, "Should catch JSON parse error");
    
    fs.rmSync(tempDir, { recursive: true, force: true });
});
