import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { validateWorkspacePath } from '../security/paths.js';
import { getWorkspaceRoot } from '../security/workspace.js';

test('Path Validation blocks symlinks pointing outside workspace', () => {
    const root = getWorkspaceRoot();
    const linkPath = path.join(root, 'malicious_link');
    const targetPath = path.join(root, '..', '..');
    
    try {
        // Create symlink pointing outside
        if (fs.existsSync(linkPath)) fs.unlinkSync(linkPath);
        fs.symlinkSync(targetPath, linkPath, 'dir');
        
        assert.throws(() => {
            validateWorkspacePath('malicious_link/somefile');
        }, /Path traversal blocked/);
        
    } catch (e: any) {
        // If symlink creation fails due to Windows privileges, skip or pass
        if (e.code === 'EPERM') {
            console.warn('Skipping symlink test due to Windows EPERM');
        } else {
            throw e;
        }
    } finally {
        if (fs.existsSync(linkPath)) fs.unlinkSync(linkPath);
    }
});
