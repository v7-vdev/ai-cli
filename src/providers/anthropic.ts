import Anthropic from "@anthropic-ai/sdk";
import { AIProvider, Message, ChatResponse, GenericTool } from "./provider.js";
import dotenv from "dotenv";

dotenv.config();

export class AnthropicProvider implements AIProvider {
    private ai: Anthropic;
    private model: string = "claude-3-7-sonnet-20250219";

    constructor() {
        if (!process.env.ANTHROPIC_API_KEY) {
            console.warn("Warning: ANTHROPIC_API_KEY is not set in the environment.");
        }
        
        this.ai = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY || "",
        });
    }

    async chat(messages: Message[], tools?: GenericTool[]): Promise<ChatResponse> {
        try {
            // Extract system prompt
            const systemMessages = messages.filter(m => m.role === "system").map(m => m.content).join("\n");
            
            // Format messages
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
                        id: `call_${msg.functionCall.name}`, // Mocking ID, normally tracked from previous
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

            const anthropicTools: Anthropic.Tool[] | undefined = tools && tools.length > 0 
                ? tools.map(t => ({
                    name: t.name,
                    description: t.description || "",
                    input_schema: {
                        type: t.parameters?.type?.toLowerCase() || "object",
                        properties: t.parameters?.properties || {},
                        required: t.parameters?.required || []
                    }
                }))
                : undefined;

            const requestPayload: any = {
                model: this.model,
                max_tokens: 8192,
                system: systemMessages,
                messages: anthropicMessages,
            };
            if (anthropicTools) {
                requestPayload.tools = anthropicTools;
            }

            const response = await this.ai.messages.create(requestPayload);

            // Parse response
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
            console.error("Anthropic API Error:", error.message || error);
            return { text: "Something went wrong communicating with Anthropic." };
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

    getMetadata() {
        return {
            name: "Anthropic",
            fastInference: false,
            contextWindowSize: 200000,
            supportsToolExecution: true
        };
    }
}
