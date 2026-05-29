import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { KeyManager } from '../security/keys.js';

test('Chaos: Config Corruption Recovery', (t) => {
    const CONFIG_DIR = path.join(os.homedir(), ".ork");
    const KEYS_FILE_PATH = path.join(CONFIG_DIR, "keys.json");
    
    // Write malformed JSON
    if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(KEYS_FILE_PATH, "{ \"broken\": json ");

    // Should not throw exception
    assert.doesNotThrow(() => {
        const keys = KeyManager.listConfiguredProviders();
        assert.deepStrictEqual(keys, []);
    });

    // Original file should be quarantined
    const files = fs.readdirSync(CONFIG_DIR);
    assert.ok(files.some(f => f.includes('keys.json.corrupt')));
});
