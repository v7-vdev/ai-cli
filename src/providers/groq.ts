import dotenv from "dotenv";
import { AIProvider, Message, ChatResponse, GenericTool } from "./provider.js";

dotenv.config();

export class GroqProvider implements AIProvider {
    private model: string = "llama-3.3-70b-versatile";

    async chat(messages: Message[], tools?: GenericTool[]): Promise<ChatResponse> {
        try {
            const formattedMessages = messages.map(m => {
                if (m.functionCall && m.role === "model") {
                    return {
                        role: "assistant",
                        tool_calls: [{
                            id: `call_${m.functionCall.name}`,
                            type: "function",
                            function: {
                                name: m.functionCall.name,
                                arguments: JSON.stringify(m.functionCall.args)
                            }
                        }]
                    };
                }
                if (m.functionResponse && m.role === "user") {
                    return {
                        role: "tool",
                        tool_call_id: `call_${m.functionResponse.name}`,
                        name: m.functionResponse.name,
                        content: typeof m.functionResponse.response.result === "string"
                            ? m.functionResponse.response.result
                            : JSON.stringify(m.functionResponse.response.result)
                    };
                }
                return {
                    role: m.role === "model" ? "assistant" : m.role,
                    content: m.content || ""
                };
            });

            const openaiTools = tools && tools.length > 0 ? tools.map(t => ({
                type: "function",
                function: {
                    name: t.name,
                    description: t.description || "",
                    parameters: t.parameters || { type: "object", properties: {} }
                }
            })) : undefined;

            const response = await fetch(
                "https://api.groq.com/openai/v1/chat/completions",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model: this.model,
                        messages: formattedMessages,
                        tools: openaiTools,
                    }),
                }
            );

            const data = await response.json() as any;

            if (!response.ok) {
                return { text: `API Error: ${data.error?.message}` };
            }

            const choice = data.choices[0].message;
            let functionCall: any = undefined;

            if (choice.tool_calls && choice.tool_calls.length > 0) {
                const call = choice.tool_calls[0].function;
                functionCall = {
                    name: call.name,
                    args: JSON.parse(call.arguments)
                };
            }

            return { text: choice.content || undefined, functionCall };
        } catch (error: any) {
            console.log(error);
            return { text: "Something went wrong communicating with Groq." };
        }
    }

    setModel(modelName: string): void {
        this.model = modelName;
    }

    getAvailableModels(): { value: string; label: string; }[] {
        return [
            { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile" },
            { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant" },
            { value: "gemma2-9b-it", label: "Gemma 2 9B IT" },
            { value: "mixtral-8x7b-32768", label: "Mixtral 8x7B" }
        ];
    }
}