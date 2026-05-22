import chalk from "chalk";
import ora from "ora";
import { confirm } from "@clack/prompts";
import { readFile } from "./readFile.js";
import { writeFile } from "./writeFile.js";
import { runCommand } from "./runCommand.js";
import { RuntimeContext } from "../context/runtimeContext.js";

export class ToolExecutor {
    private ctx: RuntimeContext;

    constructor(ctx: RuntimeContext) {
        this.ctx = ctx;
    }

    public async executeTool(fn: { name: string; args: any }): Promise<any> {
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
                try {
                    const res = await this.ctx.mcp.callMcpTool(serverName, toolName, fn.args);
                    mcpSpinner.succeed(`Finished MCP Tool.`);
                    toolResult = res;
                } catch (err: any) {
                    mcpSpinner.fail(`MCP Tool failed.`);
                    toolResult = `Error: ${err.message}`;
                }
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

        return toolResult;
    }
}
