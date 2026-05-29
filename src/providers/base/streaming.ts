import { ChatResponse, FunctionCall } from "./provider.js";
import { MalformedResponseError, StreamingInterruptedError } from "./errors.js";

/**
 * Streaming normalization layer to handle SSE chunk differences,
 * delta payloads, reasoning chunks, and tool-call fragments.
 */

export interface StreamEvent {
    type: 'text' | 'tool_call' | 'reasoning' | 'error' | 'done';
    content?: string;
    toolCall?: FunctionCall;
    error?: Error;
}

export class StreamNormalizer {
    private fullText: string = "";
    private currentToolCall: any = null;

    constructor(private providerId: string) {}

    public processDelta(delta: any): StreamEvent[] {
        const events: StreamEvent[] = [];

        try {
            // Handle standard text deltas
            if (delta.content) {
                this.fullText += delta.content;
                events.push({ type: 'text', content: delta.content });
            }

            // Handle reasoning/think chunks (DeepSeek, etc.)
            if (delta.reasoning || delta.reasoning_content) {
                const reasoning = delta.reasoning || delta.reasoning_content;
                events.push({ type: 'reasoning', content: reasoning });
            }

            // Handle tool call deltas
            if (delta.tool_calls && delta.tool_calls.length > 0) {
                for (const tc of delta.tool_calls) {
                    if (tc.id) {
                        // New tool call
                        this.currentToolCall = {
                            name: tc.function?.name || "",
                            argsString: tc.function?.arguments || ""
                        };
                    } else if (tc.function?.arguments && this.currentToolCall) {
                        // Append arguments fragment
                        this.currentToolCall.argsString += tc.function.arguments;
                    }
                }
            }

            return events;
        } catch (e: any) {
            events.push({ type: 'error', error: new MalformedResponseError(this.providerId, e) });
            return events;
        }
    }

    public finalize(): StreamEvent[] {
        const events: StreamEvent[] = [];
        
        if (this.currentToolCall) {
            try {
                let args = {};
                try { args = JSON.parse(this.currentToolCall.argsString || "{}"); } catch {}
                events.push({
                    type: 'tool_call',
                    toolCall: {
                        name: this.currentToolCall.name,
                        args: args
                    }
                });
            } catch (e) {
                events.push({ type: 'error', error: new MalformedResponseError(this.providerId, "Failed to parse tool arguments in stream") });
            }
        }

        events.push({ type: 'done' });
        return events;
    }

    public getChatResponse(): ChatResponse {
        const res: ChatResponse = {};
        if (this.fullText) res.text = this.fullText;
        if (this.currentToolCall) {
            try {
                res.functionCall = {
                    name: this.currentToolCall.name,
                    args: (() => { try { return JSON.parse(this.currentToolCall.argsString || "{}"); } catch { return {}; } })()
                };
            } catch (e) {
                // Return as text if it fails to parse
                res.text = (res.text || "") + `\n[Malformed Tool Call]: ${this.currentToolCall.name} ${this.currentToolCall.argsString}`;
            }
        }
        return res;
    }
}
