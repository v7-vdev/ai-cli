import chalk from "chalk";
import { AIProvider, Message } from "../providers/provider.js";
import { GeminiProvider } from "../providers/gemini.js";
import { GroqProvider } from "../providers/groq.js";
import { AnthropicProvider } from "../providers/anthropic.js";
import { McpManager } from "../mcp/client.js";

export class RuntimeContext {
    public provider: AIProvider;
    public history: Message[] = [];
    public mcp: McpManager;
    public cwd: string;

    // A reference to the command parser so commands can dynamically trigger other commands
    // We type it as 'any' or a function to avoid circular dependencies
    public executeCommand: (input: string) => Promise<boolean>;

    constructor(executeCommand: (input: string) => Promise<boolean>) {
        this.executeCommand = executeCommand;
        this.mcp = new McpManager();
        this.cwd = process.cwd();
        
        if (process.env.ANTHROPIC_API_KEY) {
            this.provider = new AnthropicProvider();
        } else if (process.env.GEMINI_API_KEY) {
            this.provider = new GeminiProvider();
        } else if (process.env.GROQ_API_KEY) {
            this.provider = new GroqProvider();
        } else {
            console.log(chalk.yellow("Warning: No API keys found in .env. Defaulting to Gemini."));
            this.provider = new GeminiProvider();
        }

        this.initSystemPrompt();
    }

    private initSystemPrompt() {
        this.history = [{
            role: "system",
            content: "You are an expert AI Coding Assistant CLI. You help the user by writing code, analyzing files, and running commands. Return beautiful markdown format. You have native tool calling and MCP server tools enabled!"
        }];
    }

    public addMessage(message: Message) {
        this.history.push(message);
    }

    public clearHistory() {
        this.initSystemPrompt();
    }

    public async initMcp() {
        await this.mcp.connectAll();
    }
}
