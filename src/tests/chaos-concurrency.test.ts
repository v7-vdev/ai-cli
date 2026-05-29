import { test } from 'node:test';
import assert from 'node:assert';
import { globalLimiter } from '../execution/limiter.js';

test('Chaos: Concurrency Storm', async (t) => {
    let active = 0;
    let maxObserved = 0;

    const tasks = Array.from({ length: 50 }).map(async () => {
        await globalLimiter.acquire();
        active++;
        maxObserved = Math.max(maxObserved, active);
        await new Promise(r => setTimeout(r, 10)); // simulate work
        active--;
        globalLimiter.release();
    });

    await Promise.all(tasks);
    
    // Max concurrency is 5
    assert.strictEqual(maxObserved, 5);
});
