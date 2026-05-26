import { GoogleGenAI, Type } from "@google/genai";
import { AIProvider, Message, ChatResponse, GenericTool } from "./provider.js";
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

    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            console.warn("Warning: GEMINI_API_KEY is not set in the environment.");
        }
        
        this.ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY || "",
        });
    }

    async chat(messages: Message[], tools?: GenericTool[]): Promise<ChatResponse> {
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
                config: { tools: geminiTools }
            });

            const fnCall = response.functionCalls?.[0];
            if (fnCall && fnCall.name) {
                return { functionCall: { name: fnCall.name, args: fnCall.args as any } };
            }

            return { text: response.text || "No response text." };
        } catch (error: any) {
            console.error("Gemini API Error:", error.message || error);
            return { text: "Something went wrong communicating with Gemini." };
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

    getMetadata() {
        return {
            name: "Gemini",
            fastInference: this.model.includes('flash'),
            contextWindowSize: 1000000,
            supportsToolExecution: true
        };
    }
}
