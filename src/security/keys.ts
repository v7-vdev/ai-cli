import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import { writeAtomicSync } from "../utils/fs.js";

const CONFIG_DIR = path.join(os.homedir(), ".ork");
const MASTER_KEY_PATH = path.join(CONFIG_DIR, "master.key");
const KEYS_FILE_PATH = path.join(CONFIG_DIR, "keys.json");
const ALGORITHM = "aes-256-gcm";

export class KeyManager {
    private static initialized = false;
    private static masterKey: Buffer | null = null;

    private static init() {
        if (this.initialized) return;

        if (!fs.existsSync(CONFIG_DIR)) {
            fs.mkdirSync(CONFIG_DIR, { recursive: true });
        }

        if (!fs.existsSync(MASTER_KEY_PATH)) {
            // Generate a secure 32-byte master key
            this.masterKey = crypto.randomBytes(32);
            // Save it securely (read/write only by user)
            writeAtomicSync(MASTER_KEY_PATH, this.masterKey, { mode: 0o600 });
        } else {
            try {
                this.masterKey = fs.readFileSync(MASTER_KEY_PATH);
                if (this.masterKey.length !== 32) {
                    throw new Error("Invalid master key length");
                }
            } catch (error) {
                throw new Error("Master key is corrupted or inaccessible. Run /provider repair to reset.");
            }
        }
        
        if (!fs.existsSync(KEYS_FILE_PATH)) {
            writeAtomicSync(KEYS_FILE_PATH, JSON.stringify({}), { mode: 0o600 });
        }

        this.initialized = true;
    }

    private static encrypt(text: string): { ciphertext: string, iv: string, authTag: string } {
        if (!this.masterKey) throw new Error("Master key not initialized");
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv(ALGORITHM, this.masterKey, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');
        return { ciphertext: encrypted, iv: iv.toString('hex'), authTag };
    }

    private static decrypt(encryptedData: { ciphertext: string, iv: string, authTag: string }): string {
        if (!this.masterKey) throw new Error("Master key not initialized");
        const decipher = crypto.createDecipheriv(
            ALGORITHM, 
            this.masterKey, 
            Buffer.from(encryptedData.iv, 'hex')
        );
        decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
        let decrypted = decipher.update(encryptedData.ciphertext, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    public static setKey(providerId: string, apiKey: string): void {
        this.init();
        try {
            const keysData = JSON.parse(fs.readFileSync(KEYS_FILE_PATH, 'utf8'));
            keysData[providerId] = this.encrypt(apiKey);
            writeAtomicSync(KEYS_FILE_PATH, JSON.stringify(keysData, null, 2), { mode: 0o600 });
        } catch (error) {
            throw new Error(`Failed to save key for ${providerId}: ${(error as Error).message}`);
        }
    }

    public static getKey(providerId: string): string | null {
        this.init();
        // Fallback to environment variables if present
        const envKey = process.env[`${providerId.toUpperCase()}_API_KEY`];
        if (envKey) return envKey;

        try {
            const keysData = JSON.parse(fs.readFileSync(KEYS_FILE_PATH, 'utf8'));
            if (keysData[providerId]) {
                return this.decrypt(keysData[providerId]);
            }
            return null;
        } catch (error: any) {
            if (error.message.includes("Unsupported state") || error.message.includes("auth tag")) {
                throw new Error("Unable to decrypt provider credentials. Run /provider repair");
            }
            return null; // File might be empty or invalid JSON
        }
    }

    public static removeKey(providerId: string): void {
        this.init();
        try {
            const keysData = JSON.parse(fs.readFileSync(KEYS_FILE_PATH, 'utf8'));
            if (keysData[providerId]) {
                delete keysData[providerId];
                writeAtomicSync(KEYS_FILE_PATH, JSON.stringify(keysData, null, 2), { mode: 0o600 });
            }
        } catch (error) {
            throw new Error(`Failed to remove key for ${providerId}: ${(error as Error).message}`);
        }
    }

    public static listConfiguredProviders(): string[] {
        this.init();
        try {
            const keysData = JSON.parse(fs.readFileSync(KEYS_FILE_PATH, 'utf8'));
            return Object.keys(keysData);
        } catch (error) {
            return [];
        }
    }

    public static repairKeys(): void {
        if (fs.existsSync(MASTER_KEY_PATH)) fs.unlinkSync(MASTER_KEY_PATH);
        if (fs.existsSync(KEYS_FILE_PATH)) fs.unlinkSync(KEYS_FILE_PATH);
        this.initialized = false;
        this.masterKey = null;
        this.init(); // Regenerate new master key and empty keys.json
    }
}
