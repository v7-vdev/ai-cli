import Anthropic from "@anthropic-ai/sdk";
import { AIProvider, Message, ChatResponse, GenericTool, ProviderMetadata } from "./base/provider.js";
import { ProviderError, TimeoutError, InvalidKeyError, ProviderUnavailableError } from "./base/errors.js";
import { StreamNormalizer } from "./base/streaming.js";
import dotenv from "dotenv";

dotenv.config();

export class AnthropicProvider implements AIProvider {
    private ai: Anthropic;
    private model: string = "claude-3-7-sonnet-20250219";
    private abortController: AbortController | null = null;

    constructor(apiKey?: string) {
        this.ai = new Anthropic({
            apiKey: apiKey || process.env.ANTHROPIC_API_KEY || "",
        });
    }

    private convertMessages(messages: Message[]): Anthropic.MessageParam[] {
        const anthropicMessages: Anthropic.MessageParam[] = [];
        for (const msg of messages.filter(m => m.role !== "system")) {
            const role = msg.role === "model" ? "assistant" : "user";
            const content: any[] = [];
            
            if (msg.content) {
                content.push({ type: "text", text: msg.content });
            }
            
            if (msg.functionCall && role === "assistant") {
                content.push({
                    type: "tool_use",
                    id: `call_${msg.functionCall.name}`,
                    name: msg.functionCall.name,
                    input: msg.functionCall.args,
                });
            }
            
            if (msg.functionResponse && role === "user") {
                content.push({
                    type: "tool_result",
                    tool_use_id: `call_${msg.functionResponse.name}`,
                    content: typeof msg.functionResponse.response.result === "string" 
                        ? msg.functionResponse.response.result 
                        : JSON.stringify(msg.functionResponse.response.result)
                });
            }
            
            anthropicMessages.push({ role, content });
        }
        return anthropicMessages;
    }

    private convertTools(tools?: GenericTool[]): Anthropic.Tool[] | undefined {
        if (!tools || tools.length === 0) return undefined;
        return tools.map(t => ({
            name: t.name,
            description: t.description || "",
            input_schema: {
                type: t.parameters?.type?.toLowerCase() || "object",
                properties: t.parameters?.properties || {},
                required: t.parameters?.required || []
            } as any
        }));
    }

    async chat(messages: Message[], tools?: GenericTool[], signal?: AbortSignal): Promise<ChatResponse> {
        if (!signal) this.abortController = new AbortController();
        const activeSignal = signal || this.abortController?.signal;
        try {
            const systemMessages = messages.filter(m => m.role === "system").map(m => m.content).join("\n");
            const anthropicMessages = this.convertMessages(messages);
            const anthropicTools = this.convertTools(tools);

            const requestPayload: any = {
                model: this.model,
                max_tokens: 8192,
                system: systemMessages,
                messages: anthropicMessages,
            };
            if (anthropicTools) {
                requestPayload.tools = anthropicTools;
            }

            const response = await this.ai.messages.create(requestPayload, {
                signal: activeSignal as any
            });

            let text = "";
            let functionCall: any = undefined;

            for (const block of response.content) {
                if (block.type === "text") {
                    text += block.text;
                } else if (block.type === "tool_use") {
                    functionCall = {
                        name: block.name,
                        args: block.input,
                    };
                }
            }

            const returnObj: ChatResponse = {};
            if (text) returnObj.text = text;
            if (functionCall) returnObj.functionCall = functionCall;
            
            return returnObj;
        } catch (error: any) {
            if (error.name === 'AbortError') return { text: "[Request cancelled]" };
            if (error.status === 401) throw new InvalidKeyError("anthropic", error);
            if (error.status === 529 || error.status >= 500) throw new ProviderUnavailableError("anthropic", error);
            throw new ProviderError(error.message, "anthropic", error);
        } finally {
            this.abortController = null;
        }
    }

    async stream(messages: Message[], tools?: GenericTool[], onChunk?: (chunk: string) => void, signal?: AbortSignal): Promise<ChatResponse> {
        if (!signal) this.abortController = new AbortController();
        const activeSignal = signal || this.abortController?.signal;
        try {
            const systemMessages = messages.filter(m => m.role === "system").map(m => m.content).join("\n");
            const requestPayload: any = {
                model: this.model,
                max_tokens: 8192,
                system: systemMessages,
                messages: this.convertMessages(messages),
                stream: true
            };
            const anthropicTools = this.convertTools(tools);
            if (anthropicTools) requestPayload.tools = anthropicTools;

            const stream = await this.ai.messages.create(requestPayload, {
                signal: activeSignal as any
            });

            const normalizer = new StreamNormalizer("anthropic");
            for await (const chunk of stream as any) {
                if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
                    normalizer.processDelta({ content: chunk.delta.text });
                    if (onChunk) onChunk(chunk.delta.text);
                } else if (chunk.type === "content_block_start" && chunk.content_block.type === "tool_use") {
                    normalizer.processDelta({ tool_calls: [{ id: chunk.content_block.id, function: { name: chunk.content_block.name, arguments: "" } }] });
                } else if (chunk.type === "content_block_delta" && chunk.delta.type === "input_json_delta") {
                    normalizer.processDelta({ tool_calls: [{ function: { arguments: chunk.delta.partial_json } }] });
                }
            }
            
            normalizer.finalize();
            return normalizer.getChatResponse();
        } catch (error: any) {
            if (error.name === 'AbortError') return { text: "\n[Stream cancelled]" };
            throw new ProviderError(error.message, "anthropic", error);
        } finally {
            this.abortController = null;
        }
    }

    setModel(modelName: string): void {
        this.model = modelName;
    }

    getAvailableModels(): { value: string; label: string; }[] {
        return [
            { value: "claude-3-7-sonnet-20250219", label: "Claude 3.7 Sonnet" },
            { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
            { value: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku" }
        ];
    }

    getMetadata(): ProviderMetadata {
        return {
            id: "anthropic",
            name: "Anthropic",
            capabilities: {
                supportsStreaming: true,
                supportsTools: true,
                supportsReasoning: false,
                supportsVision: true,
                supportsLongContext: true,
                contextWindow: 200000,
                latencyProfile: 'balanced',
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
