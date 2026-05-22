import { intro, outro, text, spinner, isCancel, confirm } from "@clack/prompts";
import chalk from "chalk";
import ora from "ora";
import { marked } from "marked";
import TerminalRenderer from "marked-terminal";
import { CommandParser } from "./utils/commandParser.js";
import { ToolExecutor } from "./tools/executor.js";
import { RuntimeContext } from "./context/runtimeContext.js";
import boxen from "boxen";
import figlet from "figlet";

// @ts-ignore
marked.setOptions({ renderer: new TerminalRenderer() });

export class REPL {
    private ctx: RuntimeContext;
    private commandParser: CommandParser;
    private toolExecutor: ToolExecutor;
    
    constructor() {
        this.commandParser = new CommandParser();
        
        // Pass a bound reference to executeCommand into RuntimeContext
        this.ctx = new RuntimeContext(async (input: string) => {
            return await this.commandParser.execute(input, this.ctx);
        });

        this.toolExecutor = new ToolExecutor(this.ctx);
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
        await this.ctx.initMcp();
        initSpinner.succeed(`Connected to ${this.ctx.mcp.getServers().length} MCP server(s).`);

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
                const wasCommand = await this.ctx.executeCommand(cmd);
                if (!wasCommand) {
                    await this.handleChat(cmd);
                }
            } catch (err: any) {
                console.log(chalk.red(`\nError: ${err.message}\n`));
            }
        }
    }

    private async handleChat(input: string) {
        this.ctx.addMessage({ role: "user", content: input });
        
        let toolExecutionCount = 0;
        const MAX_AUTONOMOUS_STEPS = 5;

        this.ctx.logger.log("INFO", "REPL", `Chat loop started for input: ${input}`);

        while (true) {
            if (toolExecutionCount >= MAX_AUTONOMOUS_STEPS) {
                this.ctx.logger.log("WARN", "REPL", `Autonomous step limit reached (${MAX_AUTONOMOUS_STEPS}). Prompting user.`);
                console.log(chalk.yellow(`\n⚠ Reached maximum autonomous steps (${MAX_AUTONOMOUS_STEPS}).`));
                const continueLoop = await confirm({
                    message: chalk.yellow.bold("Allow AI to continue its chain of thought?"),
                    initialValue: true
                });
                
                if (isCancel(continueLoop) || !continueLoop) {
                    console.log(chalk.red("✖ Autonomous loop aborted by user."));
                    this.ctx.logger.log("WARN", "REPL", `Autonomous loop aborted by user.`);
                    break;
                } else {
                    this.ctx.logger.log("INFO", "REPL", `User allowed autonomous loop to continue.`);
                    toolExecutionCount = 0; // Reset counter if allowed
                }
            }

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

            const mcpTools = await this.ctx.mcp.getMcpTools();
            const allTools = [...nativeTools, ...mcpTools];

            const response = await this.ctx.provider.chat(this.ctx.history, allTools);
            
            s.stop(chalk.green("AI:"));
            
            if (response.text && response.text !== "No response text.") {
                console.log(marked.parse(response.text));
                this.ctx.addMessage({ role: "model", content: response.text });
            }

            if (response.functionCall) {
                const fn = response.functionCall;
                this.ctx.addMessage({ role: "model", functionCall: fn });

                toolExecutionCount++;
                const toolResult = await this.toolExecutor.executeTool(fn);

                this.ctx.addMessage({
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
