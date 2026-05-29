import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { WorkspaceScanner } from '../workspace/scanner.js';

test('Chaos: Symlink Loop Resolution', async (t) => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ork-chaos-symlink-'));
    const linkPath = path.join(tempDir, 'link');
    
    try {
        fs.symlinkSync(tempDir, linkPath, 'dir');
    } catch {
        // Windows might block symlink creation without admin rights, skip gracefully
        return;
    }

    // Should not throw Max Call Stack Size Exceeded
    const metadata = await WorkspaceScanner.scan(tempDir);
    assert.ok(metadata);
});
