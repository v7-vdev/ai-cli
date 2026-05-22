import chalk from "chalk";
import { outro } from "@clack/prompts";
import { Command, CommandContext } from "./command.js";

export const clearCommand: Command = {
    name: "/clear",
    description: "Clear conversation history",
    execute: async (args: string[], ctx: CommandContext) => {
        ctx.setHistory([{
            role: "system",
            content: "You are an expert AI Coding Assistant CLI. You help the user by writing code, analyzing files, and running commands. Return beautiful markdown format. You have native tool calling and MCP server tools enabled!"
        }]);
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
  /write <file> <text>  - Write text to a file (or let AI generate it)
  /run <command>        - Run a terminal command and add output to context
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
