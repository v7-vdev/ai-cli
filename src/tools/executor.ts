import chalk from "chalk";
import { readFile } from "./readFile.js";
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
            
            toolResult = await this.ctx.pipeline.executeMcp(serverName, toolName, fn.args);
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
            toolResult = await this.ctx.pipeline.executeWriteFile(fn.args.path, fn.args.content);
        } else if (fn.name === "runCommand") {
            toolResult = await this.ctx.pipeline.executeRunCommand(fn.args.command);
        } else {
            toolResult = `Unknown tool: ${fn.name}`;
            this.ctx.logger.log("WARN", "TOOL", `Unknown tool requested: ${fn.name}`);
        }

        return toolResult;
    }
}
