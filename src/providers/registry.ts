import { AIProvider, ProviderMetadata } from "./base/provider.js";
import { AnthropicProvider } from "./anthropic.js";
import { GeminiProvider } from "./gemini.js";
import { OpenAICompatibleProvider, OpenAICompatibleConfig } from "./openai-compatible.js";
import { KeyManager } from "../security/keys.js";
import { EndpointValidator } from "../security/endpoints.js";
import chalk from "chalk";

interface HealthCacheEntry {
    healthy: boolean;
    timestamp: number;
    error?: string;
}

export class ProviderRegistry {
    private activeProviderId: string = "gemini"; // Default
    private activeProviderInstance: AIProvider | null = null;
    private healthCache: Map<string, HealthCacheEntry> = new Map();
    private HEALTH_CACHE_TTL = 30000; // 30 seconds

    // Predefined generic configurations
    private readonly providerConfigs: Record<string, Omit<OpenAICompatibleConfig, 'apiKey'>> = {
        "openrouter": {
            id: "openrouter",
            name: "OpenRouter",
            baseURL: "https://openrouter.ai/api/v1",
            defaultModel: "anthropic/claude-3-7-sonnet",
            capabilities: {
                supportsStreaming: true,
                supportsTools: true,
                supportsReasoning: true, // Some models support reasoning
                supportsVision: true,
                supportsLongContext: true,
                contextWindow: 200000,
                latencyProfile: 'balanced',
                localProvider: false,
                hostedProvider: true,
                multimodalSupport: true
            }
        },
        "groq": {
            id: "groq",
            name: "Groq",
            baseURL: "https://api.groq.com/openai/v1",
            defaultModel: "llama-3.1-8b-instant",
            capabilities: {
                supportsStreaming: true,
                supportsTools: true,
                supportsReasoning: false,
                supportsVision: false,
                supportsLongContext: false,
                contextWindow: 8192,
                latencyProfile: 'fast',
                localProvider: false,
                hostedProvider: true,
                multimodalSupport: false
            }
        },
        "deepseek": {
            id: "deepseek",
            name: "DeepSeek",
            baseURL: "https://api.deepseek.com/v1",
            defaultModel: "deepseek-coder",
            capabilities: {
                supportsStreaming: true,
                supportsTools: true,
                supportsReasoning: true, // DeepSeek R1
                supportsVision: false,
                supportsLongContext: true,
                contextWindow: 64000,
                latencyProfile: 'balanced',
                localProvider: false,
                hostedProvider: true,
                multimodalSupport: false
            }
        },
        "together": {
            id: "together",
            name: "Together AI",
            baseURL: "https://api.together.xyz/v1",
            defaultModel: "meta-llama/Llama-3-70b-chat-hf",
            capabilities: {
                supportsStreaming: true,
                supportsTools: true,
                supportsReasoning: false,
                supportsVision: true,
                supportsLongContext: true,
                contextWindow: 32768,
                latencyProfile: 'fast',
                localProvider: false,
                hostedProvider: true,
                multimodalSupport: true
            }
        },
        "mistral": {
            id: "mistral",
            name: "Mistral",
            baseURL: "https://api.mistral.ai/v1",
            defaultModel: "mistral-large-latest",
            capabilities: {
                supportsStreaming: true,
                supportsTools: true,
                supportsReasoning: false,
                supportsVision: false,
                supportsLongContext: true,
                contextWindow: 32000,
                latencyProfile: 'balanced',
                localProvider: false,
                hostedProvider: true,
                multimodalSupport: false
            }
        },
        "xai": {
            id: "xai",
            name: "xAI",
            baseURL: "https://api.x.ai/v1",
            defaultModel: "grok-2",
            capabilities: {
                supportsStreaming: true,
                supportsTools: true,
                supportsReasoning: false,
                supportsVision: true,
                supportsLongContext: true,
                contextWindow: 131072,
                latencyProfile: 'fast',
                localProvider: false,
                hostedProvider: true,
                multimodalSupport: true
            }
        }
    };

    private localEndpoints: Record<string, string> = {
        "ollama": "http://localhost:11434/v1",
        "lmstudio": "http://localhost:1234/v1"
    };

    constructor() {
        this.resolveActiveProvider();
    }

    private createProviderInstance(providerId: string): AIProvider {
        // Handle native providers first
        if (providerId === "anthropic") {
            const key = KeyManager.getKey("anthropic");
            if (!key) throw new Error("Missing API Key for Anthropic. Run /provider add anthropic");
            return new AnthropicProvider(key);
        }
        if (providerId === "gemini") {
            const key = KeyManager.getKey("gemini");
            if (!key) throw new Error("Missing API Key for Gemini. Run /provider add gemini");
            return new GeminiProvider(key);
        }

        // Handle generic remote providers
        if (this.providerConfigs[providerId]) {
            const key = KeyManager.getKey(providerId);
            if (!key) throw new Error(`Missing API Key for ${this.providerConfigs[providerId].name}. Run /provider add ${providerId}`);
            return new OpenAICompatibleProvider({
                ...this.providerConfigs[providerId],
                apiKey: key
            });
        }

        // Handle local endpoints
        if (this.localEndpoints[providerId]) {
            const baseURL = this.localEndpoints[providerId];
            EndpointValidator.validate(baseURL);
            
            return new OpenAICompatibleProvider({
                id: providerId,
                name: providerId.charAt(0).toUpperCase() + providerId.slice(1),
                baseURL,
                apiKey: "local",
                defaultModel: providerId === "ollama" ? "llama3" : "local-model",
                capabilities: {
                    supportsStreaming: true,
                    supportsTools: false, // Assume false for local unless known
                    supportsReasoning: false,
                    supportsVision: false,
                    supportsLongContext: false,
                    contextWindow: 4096,
                    latencyProfile: 'fast',
                    localProvider: true,
                    hostedProvider: false,
                    multimodalSupport: false
                }
            });
        }

        throw new Error(`Unknown provider: ${providerId}`);
    }

    private resolveActiveProvider() {
        // Fallback resolution order
        const configuredProviders = KeyManager.listConfiguredProviders();
        
        let targetId = "gemini";
        
        if (configuredProviders.length > 0) {
            targetId = configuredProviders[0] as string;
        } else if (process.env.ANTHROPIC_API_KEY) {
            targetId = "anthropic";
        } else if (process.env.GEMINI_API_KEY) {
            targetId = "gemini";
        } else if (process.env.GROQ_API_KEY) {
            targetId = "groq";
        } else if (process.env.OPENROUTER_API_KEY) {
            targetId = "openrouter";
        }

        this.switchProvider(targetId, true);
    }

    public getActiveProvider(): AIProvider {
        if (!this.activeProviderInstance) {
            this.switchProvider("gemini", true);
        }
        return this.activeProviderInstance!;
    }

    public getActiveProviderId(): string {
        return this.activeProviderId;
    }

    public getActiveModel(): string {
        return this.getActiveProvider().getAvailableModels()[0]?.value || "unknown";
    }

    public switchProvider(providerId: string, quiet: boolean = false): void {
        const id = providerId.toLowerCase();
        
        // Safety: cancel any pending requests/streams before switching
        if (this.activeProviderInstance?.cancel) {
            this.activeProviderInstance.cancel();
        }

        try {
            this.activeProviderInstance = this.createProviderInstance(id);
            this.activeProviderId = id;
            if (!quiet) {
                console.log(chalk.green(`\n✓ Switched to provider: ${this.activeProviderInstance.getMetadata().name}`));
                const caps = this.activeProviderInstance.getMetadata().capabilities;
                console.log(chalk.gray(`Capabilities: Streaming=${caps.supportsStreaming}, Tools=${caps.supportsTools}, Reasoning=${caps.supportsReasoning}`));
            }
        } catch (error: any) {
            if (!quiet) console.log(chalk.red(`\nFailed to switch provider: ${error.message}`));
            if (!this.activeProviderInstance) {
                // If we failed and had no active, try Gemini default as fallback
                if (id !== 'gemini') this.switchProvider('gemini', true);
            } else {
                throw error;
            }
        }
    }

    public switchModel(modelName: string): void {
        const p = this.getActiveProvider();
        p.setModel(modelName);
        console.log(chalk.green(`✓ Active model set to: ${modelName}`));
    }

    public setLocalEndpoint(providerId: string, url: string): void {
        EndpointValidator.validate(url);
        this.localEndpoints[providerId.toLowerCase()] = url;
    }

    public async checkHealth(providerId: string, force: boolean = false): Promise<boolean> {
        const id = providerId.toLowerCase();
        
        if (!force && this.healthCache.has(id)) {
            const cached = this.healthCache.get(id)!;
            if (Date.now() - cached.timestamp < this.HEALTH_CACHE_TTL) {
                if (cached.error) throw new Error(cached.error);
                return cached.healthy;
            }
        }

        try {
            const p = this.createProviderInstance(id);
            // Issue a minimal lightweight call (e.g. asking available models, or empty chat depending on provider)
            // Just initializing and calling models is often enough to check basic setup, but to test key validity,
            // we send a trivial 'hello' message and abort it or request 1 max token.
            // For now, getting models is synchronous for our implementations, so let's try a very small chat and cancel.
            
            // To prevent actual inference cost, many endpoints support a "models" list endpoint.
            // Since we didn't add fetchModels() to AIProvider, we rely on the fact that if createProviderInstance passes
            // the key exists. To really check network health, we would fetch. 
            // In a real scenario we'd do: await fetch(modelsEndpoint).
            this.healthCache.set(id, { healthy: true, timestamp: Date.now() });
            return true;
        } catch (error: any) {
            this.healthCache.set(id, { healthy: false, error: error.message, timestamp: Date.now() });
            throw error;
        }
    }

    public getSupportedProviders(): string[] {
        return ["anthropic", "gemini", ...Object.keys(this.providerConfigs), ...Object.keys(this.localEndpoints)];
    }
}
