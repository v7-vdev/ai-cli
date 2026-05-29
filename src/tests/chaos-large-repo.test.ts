import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { WorkspaceScanner } from '../workspace/scanner.js';
import { readFile } from '../tools/readFile.js';

test('Chaos: Large Repository Hash and Read', async (t) => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ork-chaos-large-'));
    const largeFilePath = path.join(tempDir, 'large.txt');
    
    // Create 1.5MB file (triggers large file protections)
    const chunk = Buffer.alloc(1024 * 1024 * 1.5, 'x');
    fs.writeFileSync(largeFilePath, chunk);

    // Should not block or return content
    const res = await readFile(largeFilePath);
    assert.strictEqual(res.success, false);
    assert.ok(res.content.includes("too large"));
});
