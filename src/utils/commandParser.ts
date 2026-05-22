import chalk from "chalk";
import { Command } from "../commands/command.js";
import { RuntimeContext } from "../context/runtimeContext.js";
import { modelsCommand } from "../commands/models.js";
import { mcpCommand } from "../commands/mcp.js";
import { readCommand, writeCommand } from "../commands/files.js";
import { generateCommand } from "../commands/generate.js";
import { runCommand } from "../commands/run.js";
import { clearCommand, helpCommand, exitCommand } from "../commands/system.js";
import { interactiveCommand } from "../commands/interactive.js";

export class CommandParser {
    private commands: Map<string, Command> = new Map();

    constructor() {
        this.register(modelsCommand);
        this.register(mcpCommand);
        this.register(readCommand);
        this.register(writeCommand);
        this.register(generateCommand);
        this.register(runCommand);
        this.register(clearCommand);
        this.register(helpCommand);
        this.register(exitCommand);
        this.register(interactiveCommand);
    }

    private register(cmd: Command) {
        this.commands.set(cmd.name, cmd);
    }

    public async execute(input: string, ctx: RuntimeContext): Promise<boolean> {
        let commandStr = input;
        
        // Handle ! shorthand
        if (input.startsWith("!")) {
            commandStr = `/run ${input.substring(1).trim()}`;
        }

        if (!commandStr.startsWith("/")) {
            return false; // Not a command
        }

        const [commandName, ...args] = commandStr.split(" ");
        const normalizedName = (commandName || "").toLowerCase();

        const cmd = this.commands.get(normalizedName);
        if (cmd) {
            await cmd.execute(args, ctx);
        } else {
            console.log(chalk.red(`Unknown command: ${commandName}. Type /commands for an interactive menu.`));
        }

        return true; // Was a command
    }
}
