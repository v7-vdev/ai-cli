import test from 'node:test';
import assert from 'node:assert';
import { redactSecrets } from '../security/secrets.js';

test('Redacts OpenAI keys', () => {
    const log = "Found key sk-Proj-abcdef1234567890ABCDabcdef1234567890 in config";
    const redacted = redactSecrets(log);
    assert.match(redacted, /\[REDACTED_API_KEY\]/);
    assert.doesNotMatch(redacted, /sk-Proj-/);
});

test('Redacts Anthropic keys', () => {
    const log = "Sending to sk-ant-api03-abcdef1234567890ABCDabcdef1234567890-test";
    const redacted = redactSecrets(log);
    assert.match(redacted, /\[REDACTED_API_KEY\]/);
    assert.doesNotMatch(redacted, /sk-ant-api03-/);
});

test('Redacts Gemini keys', () => {
    const log = "Using AIzaSyabcdef1234567890ABCDabcdef1234567890";
    const redacted = redactSecrets(log);
    assert.match(redacted, /\[REDACTED_API_KEY\]/);
    assert.doesNotMatch(redacted, /AIzaSy/);
});

test('Redacts generic environment variables', () => {
    const log = "Set env OPENAI_API_KEY=sk-old-key1234567890";
    const redacted = redactSecrets(log);
    assert.match(redacted, /\[REDACTED_SECRET\]/);
});
