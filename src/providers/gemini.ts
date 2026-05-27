import { GoogleGenAI, Type } from "@google/genai";
import { AIProvider, Message, ChatResponse, GenericTool, ProviderMetadata } from "./base/provider.js";
import { ProviderError, InvalidKeyError, ProviderUnavailableError } from "./base/errors.js";
import { StreamNormalizer } from "./base/streaming.js";
import dotenv from "dotenv";

dotenv.config();

function convertSchemaForGemini(schema: any): any {
    if (!schema) return undefined;
    const result = { ...schema };
    if (result.type) {
        result.type = String(result.type).toUpperCase();
    }
    if (result.properties) {
        for (const [k, v] of Object.entries(result.properties)) {
            result.properties[k] = convertSchemaForGemini(v);
        }
    }
    if (result.items) {
        result.items = convertSchemaForGemini(result.items);
    }
    return result;
}

export class GeminiProvider implements AIProvider {
    private ai: GoogleGenAI;
    private model: string = "gemini-2.5-flash";
    private abortController: AbortController | null = null;

    constructor(apiKey?: string) {
        this.ai = new GoogleGenAI({
            apiKey: apiKey || process.env.GEMINI_API_KEY || "",
        });
    }

    async chat(messages: Message[], tools?: GenericTool[], signal?: AbortSignal): Promise<ChatResponse> {
        this.abortController = signal ? { signal, abort: () => {} } as any : new AbortController();
        const activeSignal = signal || this.abortController?.signal;
        try {
            const contents = messages.map(msg => {
                const role = msg.role === 'system' ? 'user' : msg.role;
                const parts: any[] = [];
                
                if (msg.content) parts.push({ text: msg.content });
                if (msg.functionCall) parts.push({ functionCall: msg.functionCall });
                if (msg.functionResponse) parts.push({ functionResponse: msg.functionResponse });
                
                return { role, parts };
            });

            let geminiTools: any = undefined;
            if (tools && tools.length > 0) {
                geminiTools = [{
                    functionDeclarations: tools.map(t => ({
                        name: t.name,
                        description: t.description || "",
                        parameters: convertSchemaForGemini(t.parameters)
                    }))
                }];
            }

            const response = await this.ai.models.generateContent({
                model: this.model,
                contents: contents,
                config: { tools: geminiTools, httpOptions: { signal: activeSignal as any } } as any
            });

            const fnCall = response.functionCalls?.[0];
            if (fnCall && fnCall.name) {
                return { functionCall: { name: fnCall.name, args: fnCall.args as any } };
            }

            return { text: response.text || "No response text." };
        } catch (error: any) {
            if (error.name === 'AbortError') return { text: "[Request cancelled]" };
            if (error.message?.includes("API key not valid")) throw new InvalidKeyError("gemini", error);
            throw new ProviderError(error.message, "gemini", error);
        } finally {
            this.abortController = null;
        }
    }

    async stream(messages: Message[], tools?: GenericTool[], onChunk?: (chunk: string) => void, signal?: AbortSignal): Promise<ChatResponse> {
        this.abortController = signal ? { signal, abort: () => {} } as any : new AbortController();
        const activeSignal = signal || this.abortController?.signal;
        try {
            const contents = messages.map(msg => {
                const role = msg.role === 'system' ? 'user' : msg.role;
                const parts: any[] = [];
                if (msg.content) parts.push({ text: msg.content });
                return { role, parts };
            });

            const responseStream = await this.ai.models.generateContentStream({
                model: this.model,
                contents: contents,
                config: { httpOptions: { signal: activeSignal as any } } as any
            });

            const normalizer = new StreamNormalizer("gemini");
            for await (const chunk of responseStream) {
                if (chunk.text) {
                    normalizer.processDelta({ content: chunk.text });
                    if (onChunk) onChunk(chunk.text);
                }
                if (chunk.functionCalls && chunk.functionCalls.length > 0) {
                    const fc = chunk.functionCalls[0];
                    if (fc && fc.name) {
                        normalizer.processDelta({ tool_calls: [{ id: "fc", function: { name: fc.name, arguments: JSON.stringify(fc.args || {}) } }] });
                    }
                }
            }

            normalizer.finalize();
            return normalizer.getChatResponse();
        } catch (error: any) {
            if (error.name === 'AbortError') return { text: "\n[Stream cancelled]" };
            throw new ProviderError(error.message, "gemini", error);
        } finally {
            this.abortController = null;
        }
    }

    setModel(modelName: string): void {
        this.model = modelName;
    }

    getAvailableModels(): { value: string; label: string; }[] {
        return [
            { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
            { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" }
        ];
    }

    getMetadata(): ProviderMetadata {
        return {
            id: "gemini",
            name: "Gemini",
            capabilities: {
                supportsStreaming: true,
                supportsTools: true,
                supportsReasoning: false,
                supportsVision: true,
                supportsLongContext: true,
                contextWindow: 1000000,
                latencyProfile: this.model.includes('flash') ? 'fast' : 'comprehensive',
                localProvider: false,
                hostedProvider: true,
                multimodalSupport: true
            }
        };
    }

    cancel(): void {
        if (this.abortController) this.abortController.abort();
    }
}
