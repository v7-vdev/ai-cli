import chalk from "chalk";
import { select, isCancel, text, outro } from "@clack/prompts";
import { Command } from "./command.js";
import { RuntimeContext } from "../context/runtimeContext.js";

export const interactiveCommand: Command = {
    name: "/commands",
    description: "Interactive command menu",
    execute: async (args: string[], ctx: RuntimeContext) => {
        const selectedCmd = await select({
            message: "Select a command to run:",
            options: [
                { value: "/read", label: "/read - Read a file into context" },
                { value: "/write", label: "/write - Write text to a file" },
                { value: "/generate", label: "/generate - Generate code and write to a file" },
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
            return;
        }

        const action = selectedCmd as string;
        
        if (["/read", "/write", "/generate", "/run"].includes(action)) {
            const argInput = await text({
                message: `Enter arguments for ${action}:`,
                placeholder: "e.g., package.json or npm test",
            });
            
            if (isCancel(argInput)) {
                console.log(chalk.yellow("Command cancelled."));
                return;
            }
            
            await ctx.executeCommand(`${action} ${(argInput as string).trim()}`);
        } else if (action === "/exit") {
            outro(chalk.magenta("Goodbye!"));
            process.exit(0);
        } else {
            await ctx.executeCommand(action);
        }
    }
};
