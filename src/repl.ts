import { intro, outro, text, spinner, isCancel } from "@clack/prompts";
import chalk from "chalk";
import ora from "ora";
import { marked } from "marked";
import TerminalRenderer from "marked-terminal";
import { AIProvider, Message } from "./providers/provider.js";
import { GeminiProvider } from "./providers/gemini.js";
import { GroqProvider } from "./providers/groq.js";
import { AnthropicProvider } from "./providers/anthropic.js";
import { McpManager } from "./mcp/client.js";
import { CommandParser } from "./utils/commandParser.js";
import { ToolExecutor } from "./tools/executor.js";
import { CommandContext } from "./commands/command.js";
import boxen from "boxen";
import figlet from "figlet";

// @ts-ignore
marked.setOptions({ renderer: new TerminalRenderer() });

export class REPL {
    private provider: AIProvider;
    private history: Message[] = [];
    private mcp: McpManager;
    private commandParser: CommandParser;
    private toolExecutor: ToolExecutor;
    
    constructor() {
        this.mcp = new McpManager();
        this.commandParser = new CommandParser();
        this.toolExecutor = new ToolExecutor(this.mcp);

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
        
        this.history.push({
            role: "system",
            content: "You are an expert AI Coding Assistant CLI. You help the user by writing code, analyzing files, and running commands. Return beautiful markdown format. You have native tool calling and MCP server tools enabled!"
        });
    }

    private getContext(): CommandContext {
        return {
            provider: this.provider,
            mcp: this.mcp,
            history: this.history,
            setHistory: (newHistory: Message[]) => { this.history = newHistory; },
            runCommand: async (input: string) => { await this.commandParser.execute(input, this.getContext()); }
        };
    }

    public async start() {
        console.clear();
        
        const orange = chalk.hex('#D97757');
        
        console.log(boxen(orange('* Welcome to Open Code research preview!'), {
            padding: 0.5,
            borderColor: '#D97757',
            borderStyle: 'round',
            margin: { bottom: 1 }
        }));
        
        console.log(orange(figlet.textSync('OPEN\nCODE', { font: 'ANSI Shadow' })));
        
        const initSpinner = ora("Initializing MCP servers...").start();
        await this.mcp.connectAll();
        initSpinner.succeed(`Connected to ${this.mcp.getServers().length} MCP server(s).`);

        console.log(chalk.bold.white("\nSecurity notes:\n"));
        
        console.log(chalk.gray(`1. `) + chalk.white(`Open Code is currently in research preview`));
        console.log(chalk.gray(`   This beta version may have limitations or unexpected behaviors.`));
        console.log(chalk.gray(`   Run /bug at any time to report issues.\n`));
        
        console.log(chalk.gray(`2. `) + chalk.white(`Open Code can make mistakes`));
        console.log(chalk.gray(`   You should always review Open Code's responses, especially when`));
        console.log(chalk.gray(`   running code.\n`));
        
        console.log(chalk.gray(`3. `) + chalk.white(`Due to prompt injection risks, only use it with code you trust`));
        console.log(chalk.gray(`   For more details see:`));
        console.log(chalk.gray(`   https://github.com/open-code/security\n`));

        await text({
            message: chalk.blue("Press Enter to continue..."),
        });

        console.clear();
        console.log(chalk.gray("Type /help for commands or /exit to quit.\n"));

        while (true) {
            const input = await text({
                message: chalk.blue.bold("You"),
                placeholder: "Ask something or type a command...",
            });

            if (isCancel(input) || input === "/exit" || input === "exit") {
                outro(chalk.magenta("Goodbye!"));
                process.exit(0);
            }

            const cmd = (input as string).trim();
            if (!cmd) continue;

            try {
                const wasCommand = await this.commandParser.execute(cmd, this.getContext());
                if (!wasCommand) {
                    await this.handleChat(cmd);
                }
            } catch (err: any) {
                console.log(chalk.red(`\nError: ${err.message}\n`));
            }
        }
    }

    private async handleChat(input: string) {
        this.history.push({ role: "user", content: input });
        
        while (true) {
            const s = spinner();
            s.start(chalk.yellow("Thinking..."));
            
            const nativeTools = [
                {
                    name: "readFile",
                    description: "Read the contents of a file.",
                    parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] }
                },
                {
                    name: "writeFile",
                    description: "Write content to a file.",
                    parameters: { type: "object", properties: { path: { type: "string" }, content: { type: "string" } }, required: ["path", "content"] }
                },
                {
                    name: "runCommand",
                    description: "Run a bash/terminal command.",
                    parameters: { type: "object", properties: { command: { type: "string" } }, required: ["command"] }
                }
            ];

            const mcpTools = await this.mcp.getMcpTools();
            const allTools = [...nativeTools, ...mcpTools];

            const response = await this.provider.chat(this.history, allTools);
            
            s.stop(chalk.green("AI:"));
            
            if (response.text && response.text !== "No response text.") {
                console.log(marked.parse(response.text));
                this.history.push({ role: "model", content: response.text });
            }

            if (response.functionCall) {
                const fn = response.functionCall;
                this.history.push({ role: "model", functionCall: fn });

                const toolResult = await this.toolExecutor.executeTool(fn);

                this.history.push({
                    role: "user",
                    functionResponse: {
                        name: fn.name,
                        response: { result: toolResult }
                    }
                });
                
                // Continue loop
            } else {
                break;
            }
        }
    }
}
