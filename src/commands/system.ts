import chalk from "chalk";
import { outro } from "@clack/prompts";
import { Command } from "./command.js";
import { RuntimeContext } from "../context/runtimeContext.js";

export const clearCommand: Command = {
    name: "/clear",
    description: "Clear conversation history",
    execute: async (args: string[], ctx: RuntimeContext) => {
        ctx.clearHistory();
        console.log(chalk.green("✔ History cleared."));
    }
};

export const helpCommand: Command = {
    name: "/help",
    description: "Show help message",
    execute: async () => {
        console.log(chalk.cyan(`
Available Commands:
  ! <command>           - Shorthand to run a terminal command (e.g. ! git status)
  /commands             - Interactive command menu
  /models               - Interactive model selection menu
  /mcp [add|list]       - Manage Model Context Protocol (MCP) servers
  /read <file>          - Read a file and add it to the AI's context
  /write <file> <text>  - Write text to a file
  /generate <file> <prompt> - Generate code using AI and write it to a file
  /edit <file> <prompt> - Edit an existing file safely with AI
  /run <command>        - Run a terminal command and add output to context
  /logs [show|tail|clear] - Manage and view execution audit logs
  /clear                - Clear conversation history
  /help                 - Show this help message
  /exit                 - Quit the CLI
        `));
    }
};

export const exitCommand: Command = {
    name: "/exit",
    description: "Quit the CLI",
    execute: async () => {
        outro(chalk.magenta("Goodbye!"));
        process.exit(0);
    }
};
