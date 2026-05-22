import { intro, outro, text, spinner, isCancel, confirm, select } from "@clack/prompts";
import chalk from "chalk";
import ora from "ora";
import { marked } from "marked";
import TerminalRenderer from "marked-terminal";
import { AIProvider, Message } from "./providers/provider.js";
import { GeminiProvider } from "./providers/gemini.js";
import { GroqProvider } from "./providers/groq.js";
import { AnthropicProvider } from "./providers/anthropic.js";
import { readFile } from "./tools/readFile.js";
import { writeFile } from "./tools/writeFile.js";
import { runCommand } from "./tools/runCommand.js";
import { McpManager } from "./mcp/client.js";

// @ts-ignore
marked.setOptions({ renderer: new TerminalRenderer() });

import boxen from "boxen";
import figlet from "figlet";

export class REPL {
    private provider: AIProvider;
    private history: Message[] = [];
    private mcp: McpManager;
    
    constructor() {
        this.mcp = new McpManager();
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
                if (cmd.startsWith("/")) {
                    await this.handleSlashCommand(cmd);
                } else if (cmd.startsWith("!")) {
                    await this.handleSlashCommand(`/run ${cmd.substring(1).trim()}`);
                } else {
                    await this.handleChat(cmd);
                }
            } catch (err: any) {
                console.log(chalk.red(`\nError: ${err.message}\n`));
            }
        }
    }

    private async handleSlashCommand(input: string) {
        const [command, ...args] = input.split(" ");
        const argStr = args.join(" ");

        switch ((command || "").toLowerCase()) {
            case "/models":
                const availableModels = this.provider.getAvailableModels();
                const selectedModel = await select({
                    message: "Select a model:",
                    options: availableModels,
                });
                
                if (isCancel(selectedModel)) {
                    console.log(chalk.yellow("Model selection cancelled."));
                    break;
                }
                
                this.provider.setModel(selectedModel as string);
                console.log(chalk.green(`✔ Model set to: ${selectedModel}`));
                break;
                
            case "/mcp":
                const mcpAction = args[0];
                if (mcpAction === "add") {
                    const serverName = args[1];
                    const cmdBinary = args[2];
                    const cmdArgs = args.slice(3);
                    if (!serverName || !cmdBinary) {
                        console.log(chalk.red("Usage: /mcp add <name> <command> [args...]"));
                        break;
                    }
                    const addSpinner = ora(`Adding and connecting MCP server '${serverName}'...`).start();
                    await this.mcp.addServer(serverName, cmdBinary, cmdArgs);
                    addSpinner.succeed(`Added and connected MCP server: ${serverName}`);
                } else if (mcpAction === "list") {
                    const servers = this.mcp.getServers();
                    if (servers.length === 0) {
                        console.log(chalk.yellow("No MCP servers connected."));
                    } else {
                        console.log(chalk.cyan(`Connected MCP Servers:\n  - ${servers.join("\n  - ")}`));
                    }
                } else {
                    console.log(chalk.red("Usage: /mcp [add|list]"));
                }
                break;

            case "/commands":
                const selectedCmd = await select({
                    message: "Select a command to run:",
                    options: [
                        { value: "/read", label: "/read - Read a file into context" },
                        { value: "/write", label: "/write - Write text to a file" },
                        { value: "/run", label: "/run - Run a terminal command" },
                        { value: "/models", label: "/models - Change AI model" },
                        { value: "/mcp", label: "/mcp - Manage MCP Servers" },
                        { value: "/clear", label: "/clear - Clear conversation history" },
                        { value: "/help", label: "/help - Show help message" },
                        { value: "/exit", label: "/exit - Quit the CLI" }
                    ],
                });

                if (isCancel(selectedCmd)) {
                    console.log(chalk.yellow("Command selection cancelled."));
                    break;
                }

                const action = selectedCmd as string;
                
                if (["/read", "/write", "/run"].includes(action)) {
                    const argInput = await text({
                        message: `Enter arguments for ${action}:`,
                        placeholder: "e.g., package.json or npm test",
                    });
                    
                    if (isCancel(argInput)) {
                        console.log(chalk.yellow("Command cancelled."));
                        break;
                    }
                    
                    await this.handleSlashCommand(`${action} ${(argInput as string).trim()}`);
                } else if (action === "/exit") {
                    outro(chalk.magenta("Goodbye!"));
                    process.exit(0);
                } else {
                    await this.handleSlashCommand(action);
                }
                break;

            case "/help":
                console.log(chalk.cyan(`
Available Commands:
  ! <command>           - Shorthand to run a terminal command (e.g. ! git status)
  /commands             - Interactive command menu
  /models               - Interactive model selection menu
  /mcp [add|list]       - Manage Model Context Protocol (MCP) servers
  /read <file>          - Read a file and add it to the AI's context
  /write <file> <text>  - Write text to a file (or let AI generate it)
  /run <command>        - Run a terminal command and add output to context
  /clear                - Clear conversation history
  /help                 - Show this help message
  /exit                 - Quit the CLI
                `));
                break;
                
            case "/read":
                if (!argStr) {
                    console.log(chalk.red("Usage: /read <file>"));
                    break;
                }
                const readRes = readFile(argStr);
                if (readRes.success) {
                    console.log(chalk.green(`✔ Read ${argStr} successfully.`));
                    this.history.push({
                        role: "user",
                        content: `Context added from file '${argStr}':\n\n${readRes.content}`
                    });
                    this.history.push({
                        role: "model",
                        content: `I have received the context from ${argStr}.`
                    });
                } else {
                    console.log(chalk.red(`✖ Failed to read ${argStr}: ${readRes.content}`));
                }
                break;

            case "/run":
                if (!argStr) {
                    console.log(chalk.red("Usage: /run <command>"));
                    break;
                }
                const runSpinner = ora(`Running: ${argStr}`).start();
                const runRes = await runCommand(argStr);
                
                if (runRes.success) {
                    runSpinner.succeed(`Finished: ${argStr}`);
                    console.log(chalk.gray(runRes.output || ""));
                } else {
                    runSpinner.fail(`Failed: ${argStr}`);
                    console.log(chalk.red(runRes.output || ""));
                }
                
                this.history.push({
                    role: "user",
                    content: `I ran the command '${argStr}' and got this output:\n\n${runRes.output || ""}`
                });
                this.history.push({
                    role: "model",
                    content: `I have received the command output.`
                });
                break;

            case "/write":
                if (!args[0]) {
                    console.log(chalk.red("Usage: /write <file> [prompt or content]"));
                    break;
                }
                const file = args[0];
                const contentStr = args.slice(1).join(" ");
                
                let finalContent = contentStr;
                
                if (contentStr.toLowerCase().startsWith("generate ")) {
                    const prompt = contentStr.substring(9);
                    
                    const genSpinner = ora("Generating code...").start();
                    const tempHistory = [...this.history, {
                        role: "user" as const,
                        content: `Generate code for file ${file}. Task: ${prompt}. Return ONLY the raw code without markdown blocks or explanations.`
                    }];
                    
                    const genRes = await this.provider.chat(tempHistory);
                    finalContent = genRes.text || finalContent;
                    genSpinner.succeed("Code generated.");
                }

                const writeRes = writeFile(file, finalContent, true);
                if (writeRes === "CREATED" || writeRes === "EXISTS") {
                    console.log(chalk.green(`✔ Successfully wrote to ${file}`));
                    this.history.push({
                        role: "user",
                        content: `I have written content to '${file}'.`
                    });
                    this.history.push({
                        role: "model",
                        content: `Acknowledged.`
                    });
                } else {
                    console.log(chalk.red(`✖ Failed to write to ${file}: ${writeRes}`));
                }
                break;

            case "/clear":
                this.history = [{
                    role: "system",
                    content: "You are an expert AI Coding Assistant CLI. You help the user by writing code, analyzing files, and running commands. Return beautiful markdown format. You have native tool calling enabled! You can read files, write files, and run commands autonomously to accomplish tasks."
                }];
                console.log(chalk.green("✔ History cleared."));
                break;

            default:
                console.log(chalk.red(`Unknown command: ${command}. Type /commands for an interactive menu.`));
                break;
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

                let toolResult: any;

                if (fn.name.startsWith("mcp__")) {
                    const parts = fn.name.split("__");
                    const serverName = parts[1] as string;
                    const toolName = parts[2] as string;
                    
                    const allow = await confirm({
                        message: chalk.red.bold(`Allow AI to use MCP tool '${toolName}' on '${serverName}'?`)
                    });
                    
                    if (allow) {
                        const mcpSpinner = ora(`Running MCP Tool: ${toolName}`).start();
                        const res = await this.mcp.callMcpTool(serverName, toolName, fn.args);
                        mcpSpinner.succeed(`Finished MCP Tool.`);
                        toolResult = res;
                    } else {
                        toolResult = "User denied permission.";
                        console.log(chalk.yellow("✖ Denied."));
                    }
                } else if (fn.name === "readFile") {
                    console.log(chalk.gray(`> AI is reading file: ${fn.args.path}`));
                    const res = readFile(fn.args.path);
                    toolResult = res.success ? res.content : res.content;
                } else if (fn.name === "writeFile") {
                    const allow = await confirm({
                        message: chalk.red.bold(`Allow AI to write to ${fn.args.path}?`)
                    });
                    
                    if (allow) {
                        const res = writeFile(fn.args.path, fn.args.content, true);
                        toolResult = res;
                        console.log(chalk.green(`✔ Wrote to ${fn.args.path}`));
                    } else {
                        toolResult = "User denied permission to write file.";
                        console.log(chalk.yellow("✖ Denied."));
                    }
                } else if (fn.name === "runCommand") {
                    const allow = await confirm({
                        message: chalk.red.bold(`Allow AI to run command '${fn.args.command}'?`)
                    });
                    
                    if (allow) {
                        const runSpinner = ora(`Running: ${fn.args.command}`).start();
                        const res = await runCommand(fn.args.command);
                        if (res.success) {
                            runSpinner.succeed(`Finished.`);
                            console.log(chalk.gray(res.output || ""));
                        } else {
                            runSpinner.fail(`Failed.`);
                            console.log(chalk.red(res.output || ""));
                        }
                        toolResult = res.output;
                    } else {
                        toolResult = "User denied permission to run command.";
                        console.log(chalk.yellow("✖ Denied."));
                    }
                } else {
                    toolResult = `Unknown tool: ${fn.name}`;
                }

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
