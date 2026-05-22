export interface FunctionCall {
    name: string;
    args: Record<string, any>;
}

export interface FunctionResponse {
    name: string;
    response: Record<string, any>;
}

export interface Message {
    role: "user" | "model" | "system";
    content?: string;
    functionCall?: FunctionCall;
    functionResponse?: FunctionResponse;
}

export interface GenericTool {
    name: string;
    description: string;
    parameters: any;
}

export interface ChatResponse {
    text?: string;
    functionCall?: FunctionCall;
}

export interface AIProvider {
    chat(messages: Message[], tools?: GenericTool[]): Promise<ChatResponse>;
    setModel(modelName: string): void;
    getAvailableModels(): { value: string, label: string }[];
}
