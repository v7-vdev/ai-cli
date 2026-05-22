import chalk from "chalk";
import ora from "ora";
import { Command } from "./command.js";
import { RuntimeContext } from "../context/runtimeContext.js";

export const mcpCommand: Command = {
    name: "/mcp",
    description: "Manage Model Context Protocol (MCP) servers",
    execute: async (args: string[], ctx: RuntimeContext) => {
        const mcpAction = args[0];
        if (mcpAction === "add") {
            const serverName = args[1];
            const cmdBinary = args[2];
            const cmdArgs = args.slice(3);
            if (!serverName || !cmdBinary) {
                console.log(chalk.red("Usage: /mcp add <name> <command> [args...]"));
                return;
            }
            const addSpinner = ora(`Adding and connecting MCP server '${serverName}'...`).start();
            await ctx.mcp.addServer(serverName, cmdBinary, cmdArgs);
            addSpinner.succeed(`Added and connected MCP server: ${serverName}`);
        } else if (mcpAction === "list") {
            const servers = ctx.mcp.getServers();
            if (servers.length === 0) {
                console.log(chalk.yellow("No MCP servers connected."));
            } else {
                console.log(chalk.cyan(`Connected MCP Servers:\n  - ${servers.join("\n  - ")}`));
            }
        } else {
            console.log(chalk.red("Usage: /mcp [add|list]"));
        }
    }
};
