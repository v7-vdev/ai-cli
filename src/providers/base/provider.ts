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

export interface ProviderCapabilities {
    supportsStreaming: boolean;
    supportsTools: boolean;
    supportsReasoning: boolean;
    supportsVision: boolean;
    supportsLongContext: boolean;
    contextWindow: number;
    latencyProfile: 'fast' | 'balanced' | 'comprehensive';
    localProvider: boolean;
    hostedProvider: boolean;
    multimodalSupport: boolean;
}

export interface ProviderMetadata {
    id: string;
    name: string;
    capabilities: ProviderCapabilities;
}

export interface AIProvider {
    chat(messages: Message[], tools?: GenericTool[]): Promise<ChatResponse>;
    stream?(messages: Message[], tools?: GenericTool[], onChunk?: (chunk: string) => void): Promise<ChatResponse>;
    setModel(modelName: string): void;
    getAvailableModels(): { value: string, label: string }[];
    getMetadata(): ProviderMetadata;
    cancel?(): void;
}
