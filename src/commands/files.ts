import chalk from "chalk";
import ora from "ora";
import { Command } from "./command.js";
import { RuntimeContext } from "../context/runtimeContext.js";
import { readFile } from "../tools/readFile.js";
import { writeFile } from "../tools/writeFile.js";

export const readCommand: Command = {
    name: "/read",
    description: "Read a file and add it to the AI's context",
    execute: async (args: string[], ctx: RuntimeContext) => {
        const argStr = args.join(" ");
        if (!argStr) {
            console.log(chalk.red("Usage: /read <file>"));
            return;
        }
        const readRes = await readFile(argStr);
        if (readRes.success) {
            console.log(chalk.green(`✔ Read ${argStr} successfully.`));
            ctx.addMessage({
                role: "user",
                content: `Context added from file '${argStr}':\n\n${readRes.content}`
            });
            ctx.addMessage({
                role: "model",
                content: `I have received the context from ${argStr}.`
            });
        } else {
            console.log(chalk.red(`✖ Failed to read ${argStr}: ${readRes.content}`));
        }
    }
};

import fs from "fs";
import { confirm, isCancel } from "@clack/prompts";

export const writeCommand: Command = {
    name: "/write",
    description: "Write text to a file (or let AI generate it)",
    execute: async (args: string[], ctx: RuntimeContext) => {
        if (!args[0]) {
            console.log(chalk.red("Usage: /write <file> [prompt or content]"));
            return;
        }
        const file = args[0];
        
        if (fs.existsSync(file)) {
            const shouldOverwrite = await confirm({
                message: chalk.yellow(`File '${file}' already exists. Overwrite?`),
                initialValue: false
            });
            
            if (isCancel(shouldOverwrite) || !shouldOverwrite) {
                console.log(chalk.yellow("✖ Cancelled write."));
                return;
            }
        }
        
        const contentStr = args.slice(1).join(" ");
        let finalContent = contentStr;
        
        if (contentStr.toLowerCase().startsWith("generate ")) {
            const prompt = contentStr.substring(9);
            
            const genSpinner = ora("Generating code...").start();
            const tempHistory = [...ctx.history, {
                role: "user" as const,
                content: `Generate code for file ${file}. Task: ${prompt}. Return ONLY the raw code without markdown blocks or explanations.`
            }];
            
            const genRes = await ctx.provider.chat(tempHistory);
            finalContent = genRes.text || finalContent;
            genSpinner.succeed("Code generated.");
        }

        const writeRes = await writeFile(file, finalContent, true);
        if (writeRes === "CREATED" || writeRes === "EXISTS") {
            console.log(chalk.green(`✔ Successfully wrote to ${file}`));
            ctx.addMessage({
                role: "user",
                content: `I have written content to '${file}'.`
            });
            ctx.addMessage({
                role: "model",
                content: `Acknowledged.`
            });
        } else {
            console.log(chalk.red(`✖ Failed to write to ${file}: ${writeRes}`));
        }
    }
};
