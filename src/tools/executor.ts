import chalk from "chalk";
import ora from "ora";
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
        this.ctx.logger.log("INFO", "TOOL", `Executing tool: ${fn.name} with args: ${JSON.stringify(fn.args)}`);

        if (fn.name.startsWith("mcp__")) {
            const parts = fn.name.split("__");
            const serverName = parts[1] as string;
            const toolName = parts[2] as string;
            
            const allow = await this.ctx.permissions.requestPermission("mcp", { serverName, toolName, args: fn.args });
            
            if (allow) {
                const mcpSpinner = ora(`Running MCP Tool: ${toolName}`).start();
                try {
                    const res = await this.ctx.mcp.callMcpTool(serverName, toolName, fn.args);
                    mcpSpinner.succeed(`Finished MCP Tool.`);
                    toolResult = res;
                    this.ctx.logger.log("INFO", "TOOL", `MCP Tool ${toolName} succeeded`);
                } catch (err: any) {
                    mcpSpinner.fail(`MCP Tool failed.`);
                    toolResult = `Error: ${err.message}`;
                    this.ctx.logger.log("ERROR", "TOOL", `MCP Tool ${toolName} failed: ${err.message}`);
                }
            } else {
                toolResult = "User denied permission.";
                console.log(chalk.yellow("✖ Denied."));
            }
        } else if (fn.name === "readFile") {
            const allow = await this.ctx.permissions.requestPermission("readFile", { path: fn.args.path });
            if (allow) {
                console.log(chalk.gray(`> AI is reading file: ${fn.args.path}`));
                const res = readFile(fn.args.path);
                toolResult = res.success ? res.content : res.content;
                this.ctx.logger.log("INFO", "TOOL", `readFile result length: ${toolResult.length}`);
            } else {
                toolResult = "User denied permission to read file.";
                console.log(chalk.yellow("✖ Denied."));
            }
        } else if (fn.name === "writeFile") {
            const allow = await this.ctx.permissions.requestPermission("writeFile", { path: fn.args.path, content: fn.args.content });
            
            if (allow) {
                const res = writeFile(fn.args.path, fn.args.content, true);
                toolResult = res;
                console.log(chalk.green(`✔ Wrote to ${fn.args.path}`));
                this.ctx.logger.log("INFO", "TOOL", `writeFile result: ${res}`);
            } else {
                toolResult = "User denied permission to write file.";
                console.log(chalk.yellow("✖ Denied."));
            }
        } else if (fn.name === "runCommand") {
            const allow = await this.ctx.permissions.requestPermission("runCommand", { command: fn.args.command });
            
            if (allow) {
                const runSpinner = ora(`Running: ${fn.args.command}`).start();
                const res = await runCommand(fn.args.command);
                if (res.success) {
                    runSpinner.succeed(`Finished.`);
                    console.log(chalk.gray(res.output || ""));
                    this.ctx.logger.log("INFO", "TOOL", `runCommand succeeded: ${fn.args.command}`);
                } else {
                    runSpinner.fail(`Failed.`);
                    console.log(chalk.red(res.output || ""));
                    this.ctx.logger.log("ERROR", "TOOL", `runCommand failed: ${fn.args.command} - ${res.output}`);
                }
                toolResult = res.output;
            } else {
                toolResult = "User denied permission to run command.";
                console.log(chalk.yellow("✖ Denied."));
            }
        } else {
            toolResult = `Unknown tool: ${fn.name}`;
            this.ctx.logger.log("WARN", "TOOL", `Unknown tool requested: ${fn.name}`);
        }

        return toolResult;
    }
}
