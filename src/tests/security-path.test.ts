import test from 'node:test';
import assert from 'node:assert';
import path from 'path';
import { validateWorkspacePath } from '../security/paths.js';
import { getWorkspaceRoot } from '../security/workspace.js';

test('Path Validation blocks basic traversal', () => {
    assert.throws(() => {
        validateWorkspacePath('../../etc/passwd');
    }, /Path traversal blocked/);
});

test('Path Validation blocks absolute traversal on Windows', () => {
    assert.throws(() => {
        validateWorkspacePath('C:\\Windows\\System32');
    }, /Path traversal blocked/);
});

test('Path Validation blocks absolute traversal on Unix', () => {
    assert.throws(() => {
        validateWorkspacePath('/etc/passwd');
    }, /Path traversal blocked/);
});

test('Path Validation allows local files', () => {
    const root = getWorkspaceRoot();
    const result = validateWorkspacePath('test.txt');
    assert.strictEqual(result.toLowerCase(), path.join(root, 'test.txt').toLowerCase());
});
