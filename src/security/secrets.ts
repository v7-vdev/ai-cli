import fs from "fs";
import path from "path";
import os from "os";

let cachedMasterKey: string | null = null;

function getMasterKey(): string | null {
    if (cachedMasterKey) return cachedMasterKey;
    try {
        const keyPath = path.join(os.homedir(), ".ork", "master.key");
        if (fs.existsSync(keyPath)) {
            cachedMasterKey = fs.readFileSync(keyPath, "utf-8").trim();
        }
    } catch {
        // fail silently
    }
    return cachedMasterKey;
}

export function redactSecrets(input: string): string {
    if (!input || typeof input !== "string") return input;
    let redacted = input;

    // 1. Provider keys
    // OpenAI and general sk- formats (OpenAI, old Anthropic)
    redacted = redacted.replace(/(sk-[a-zA-Z0-9_\-]{20,})/g, "[REDACTED_API_KEY]");
    
    // Anthropic explicit (sk-ant-...)
    redacted = redacted.replace(/(sk-ant-[a-zA-Z0-9_\-]{20,})/g, "[REDACTED_API_KEY]");
    
    // Gemini (AIza...)
    redacted = redacted.replace(/(AIza[a-zA-Z0-9_\-]{35,})/g, "[REDACTED_API_KEY]");
    
    // Groq (gsk_...)
    redacted = redacted.replace(/(gsk_[a-zA-Z0-9_\-]{20,})/g, "[REDACTED_API_KEY]");

    // 2. Key/Value pairs often printed in env or output
    redacted = redacted.replace(/([A-Z0-9_]*(?:API_KEY|TOKEN|SECRET|PASSWORD))\s*[=:]\s*["']?([a-zA-Z0-9_\-]{10,})["']?/gi, "$1=[REDACTED_SECRET]");

    // 3. Master Key
    const master = getMasterKey();
    if (master && master.length > 8) {
        const escapedMaster = master.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const masterRegex = new RegExp(escapedMaster, 'g');
        redacted = redacted.replace(masterRegex, "[REDACTED_MASTER_KEY]");
    }

    return redacted;
}
