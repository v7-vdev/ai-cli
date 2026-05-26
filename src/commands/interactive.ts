import { Command } from "./command.js";
import { RuntimeContext } from "../context/runtimeContext.js";
import chalk from "chalk";

export const interactiveCommand: Command = {
    name: "/commands",
    description: "Interactive command menu",
    execute: async (args: string[], ctx: RuntimeContext) => {
        if (!ctx.requestMenuSelection) {
            console.log(chalk.red("Interactive menu is not supported in this environment."));
            return;
        }

        const selectedCmd = await ctx.requestMenuSelection("Select a command to run:", [
            { value: "/read", label: "/read - Read a file into context" },
            { value: "/write", label: "/write - Write text to a file" },
            { value: "/generate", label: "/generate - Generate code and write to a file" },
            { value: "/edit", label: "/edit - Edit an existing file safely with AI" },
            { value: "/run", label: "/run - Run a terminal command" },
            { value: "/logs", label: "/logs - Manage audit logs" },
            { value: "/provider switch", label: "/provider switch - Change AI provider" },
            { value: "/model switch", label: "/model switch - Change active AI model" },
            { value: "/mcp", label: "/mcp - Manage MCP Servers" },
            { value: "/clear", label: "/clear - Clear history" },
            { value: "/exit", label: "/exit - Quit" }
        ]);

        if (!selectedCmd) {
            console.log(chalk.yellow("Command selection cancelled."));
            return;
        }

        if (["/read", "/write", "/generate", "/edit", "/run", "/logs"].includes(selectedCmd)) {
            if (!ctx.requestTextInput) {
                return;
            }
            const argInput = await ctx.requestTextInput(`Enter arguments for ${selectedCmd}:`, "e.g., package.json or npm test");
            if (!argInput) {
                console.log(chalk.yellow("Command cancelled."));
                return;
            }
            await ctx.executeCommand(`${selectedCmd} ${argInput.trim()}`);
        } else if (selectedCmd === "/exit") {
            process.exit(0);
        } else {
            await ctx.executeCommand(selectedCmd);
        }
    }
};
