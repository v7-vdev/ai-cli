import { AIProvider, Message, ChatResponse, GenericTool, ProviderMetadata } from "./base/provider.js";
import { StreamNormalizer } from "./base/streaming.js";
import { ProviderError, TimeoutError, RateLimitError, InvalidKeyError, ProviderUnavailableError, MalformedResponseError } from "./base/errors.js";

export interface OpenAICompatibleConfig {
    id: string;
    name: string;
    baseURL: string;
    apiKey: string;
    defaultModel: string;
    capabilities: ProviderMetadata["capabilities"];
}

export class OpenAICompatibleProvider implements AIProvider {
    private model: string;
    private abortController: AbortController | null = null;

    constructor(private config: OpenAICompatibleConfig) {
        this.model = config.defaultModel;
    }

    private convertMessages(messages: Message[]) {
        return messages.map(msg => {
            if (msg.role === 'system') return { role: 'system', content: msg.content };
            if (msg.role === 'model') {
                const res: any = { role: 'assistant' };
                if (msg.content) res.content = msg.content;
                if (msg.functionCall) {
                    res.tool_calls = [{
                        id: `call_${msg.functionCall.name}`,
                        type: 'function',
                        function: {
                            name: msg.functionCall.name,
                            arguments: JSON.stringify(msg.functionCall.args)
                        }
                    }];
                }
                return res;
            }
            if (msg.role === 'user') {
                if (msg.functionResponse) {
                    return {
                        role: 'tool',
                        tool_call_id: `call_${msg.functionResponse.name}`,
                        name: msg.functionResponse.name,
                        content: typeof msg.functionResponse.response.result === 'string' 
                            ? msg.functionResponse.response.result 
                            : JSON.stringify(msg.functionResponse.response.result)
                    };
                }
                return { role: 'user', content: msg.content };
            }
            return { role: 'user', content: msg.content };
        });
    }

    private convertTools(tools?: GenericTool[]) {
        if (!tools || tools.length === 0) return undefined;
        return tools.map(t => ({
            type: 'function',
            function: {
                name: t.name,
                description: t.description || "",
                parameters: t.parameters
            }
        }));
    }

    private async handleFetchError(response: Response) {
        if (response.status === 401 || response.status === 403) {
            throw new InvalidKeyError(this.config.id);
        } else if (response.status === 429) {
            throw new RateLimitError(this.config.id);
        } else if (response.status >= 500) {
            throw new ProviderUnavailableError(this.config.id, `Status ${response.status}`);
        } else {
            const errText = await response.text().catch(() => "Unknown error");
            throw new ProviderError(`API Error ${response.status}: ${errText}`, this.config.id);
        }
    }

    async chat(messages: Message[], tools?: GenericTool[]): Promise<ChatResponse> {
        this.abortController = new AbortController();
        const payload = {
            model: this.model,
            messages: this.convertMessages(messages),
            tools: this.convertTools(tools),
            stream: false
        };

        try {
            const response = await fetch(`${this.config.baseURL}/chat/completions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.config.apiKey}`
                },
                body: JSON.stringify(payload),
                signal: this.abortController.signal
            });

            if (!response.ok) {
                await this.handleFetchError(response);
            }

            const data = await response.json() as any;
            if (!data.choices || data.choices.length === 0) {
                throw new MalformedResponseError(this.config.id, "No choices returned");
            }

            const message = data.choices[0].message;
            const res: ChatResponse = {};
            if (message.content) res.text = message.content;
            if (message.tool_calls && message.tool_calls.length > 0) {
                const tc = message.tool_calls[0].function;
                try {
                    res.functionCall = {
                        name: tc.name,
                        args: JSON.parse(tc.arguments || "{}")
                    };
                } catch (e) {
                    throw new MalformedResponseError(this.config.id, "Failed to parse tool arguments");
                }
            }

            return res;
        } catch (error: any) {
            if (error.name === 'AbortError') {
                return { text: "[Request cancelled]" };
            }
            if (error instanceof ProviderError) throw error;
            throw new TimeoutError(this.config.id, error);
        } finally {
            this.abortController = null;
        }
    }

    async stream(messages: Message[], tools?: GenericTool[], onChunk?: (chunk: string) => void): Promise<ChatResponse> {
        this.abortController = new AbortController();
        const payload = {
            model: this.model,
            messages: this.convertMessages(messages),
            tools: this.convertTools(tools),
            stream: true
        };

        try {
            const response = await fetch(`${this.config.baseURL}/chat/completions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.config.apiKey}`
                },
                body: JSON.stringify(payload),
                signal: this.abortController.signal
            });

            if (!response.ok) {
                await this.handleFetchError(response);
            }

            const normalizer = new StreamNormalizer(this.config.id);
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) throw new MalformedResponseError(this.config.id, "No response body for stream");

            let buffer = "";
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (line.trim() === "data: [DONE]") continue;
                    if (line.startsWith("data: ")) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.choices && data.choices.length > 0) {
                                const delta = data.choices[0].delta;
                                const events = normalizer.processDelta(delta);
                                for (const ev of events) {
                                    if (ev.type === 'text' && ev.content && onChunk) {
                                        onChunk(ev.content);
                                    } else if (ev.type === 'reasoning' && ev.content && onChunk) {
                                        onChunk(`[Thinking...] ${ev.content}`);
                                    }
                                }
                            }
                        } catch (e) {
                            // ignore malformed chunks (sometimes incomplete SSE)
                        }
                    }
                }
            }
            normalizer.finalize();
            return normalizer.getChatResponse();
        } catch (error: any) {
            if (error.name === 'AbortError') {
                return { text: "\n[Stream cancelled by user]" };
            }
            if (error instanceof ProviderError) throw error;
            throw new TimeoutError(this.config.id, error);
        } finally {
            this.abortController = null;
        }
    }

    setModel(modelName: string): void {
        this.model = modelName;
    }

    getAvailableModels(): { value: string; label: string; }[] {
        // Since this is generic, we just expose the current model or a few defaults
        return [{ value: this.model, label: this.model }];
    }

    getMetadata(): ProviderMetadata {
        return {
            id: this.config.id,
            name: this.config.name,
            capabilities: this.config.capabilities
        };
    }

    cancel(): void {
        if (this.abortController) {
            this.abortController.abort();
        }
    }
}
