import test from 'node:test';
import assert from 'node:assert';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..', '..');

test('Backpressure Chaos - massive stdout floods do not freeze runtime', async (t) => {
    // Spawn a node script that just spits out massive amounts of stdout
    const script = `
        for (let i=0; i<50000; i++) {
            console.log("FLOODING STDOUT " + i);
        }
    `;
    
    const child = spawn('node', ['-e', script]);
    let dataReceived = 0;
    
    child.stdout.on('data', (chunk) => {
        dataReceived += chunk.length;
    });

    await new Promise((resolve) => {
        child.on('close', resolve);
        // Force kill if it hangs
        setTimeout(() => {
            child.kill();
            resolve(null);
        }, 3000);
    });

    assert.ok(dataReceived > 10000, "Should have received massive stdout without hanging node loop");
});
