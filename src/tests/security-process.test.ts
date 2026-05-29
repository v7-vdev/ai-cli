import test from 'node:test';
import assert from 'node:assert';
import { runCommand, killAllChildren } from '../tools/runCommand.js';

test('runCommand kills children on timeout', async () => {
    const result = await runCommand(['node', '-e', 'setTimeout(() => {}, 10000)'], { timeoutMs: 500 });
    assert.strictEqual(result.success, false);
    assert.match(result.output, /Command timed out/);
});

test('killAllChildren cleans up active processes without throwing', () => {
    // Spin up a detached sleep
    runCommand(['node', '-e', 'setTimeout(() => {}, 5000)']);
    
    // Attempt kill all
    assert.doesNotThrow(() => {
        killAllChildren();
    });
});
