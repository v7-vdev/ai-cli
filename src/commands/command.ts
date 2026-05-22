import { AIProvider, Message } from "../providers/provider.js";
import { McpManager } from "../mcp/client.js";

export interface CommandContext {
    provider: AIProvider;
    mcp: McpManager;
    history: Message[];
    setHistory: (newHistory: Message[]) => void;
    runCommand: (input: string) => Promise<void>;
}

export interface Command {
    name: string;
    description: string;
    execute: (args: string[], ctx: CommandContext) => Promise<void>;
}
