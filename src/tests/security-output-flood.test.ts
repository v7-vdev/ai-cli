import test from 'node:test';
import assert from 'node:assert';
import { runCommand } from '../tools/runCommand.js';

test('RunCommand terminates output flood exceeding 5MB', async () => {
    // Generate an infinite stream of output
    const result = await runCommand(['node', '-e', 'while(true) console.log("A".repeat(1024 * 1024));'], { timeoutMs: 5000 });
    
    assert.strictEqual(result.success, false);
    assert.match(result.output, /MAX_BUFFER_EXCEEDED/);
});
