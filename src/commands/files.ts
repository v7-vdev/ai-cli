import chalk from "chalk";
import ora from "ora";
import { Command, CommandContext } from "./command.js";
import { readFile } from "../tools/readFile.js";
import { writeFile } from "../tools/writeFile.js";

export const readCommand: Command = {
    name: "/read",
    description: "Read a file and add it to the AI's context",
    execute: async (args: string[], ctx: CommandContext) => {
        const argStr = args.join(" ");
        if (!argStr) {
            console.log(chalk.red("Usage: /read <file>"));
            return;
        }
        const readRes = readFile(argStr);
        if (readRes.success) {
            console.log(chalk.green(`✔ Read ${argStr} successfully.`));
            const newHistory = [...ctx.history];
            newHistory.push({
                role: "user",
                content: `Context added from file '${argStr}':\n\n${readRes.content}`
            });
            newHistory.push({
                role: "model",
                content: `I have received the context from ${argStr}.`
            });
            ctx.setHistory(newHistory);
        } else {
            console.log(chalk.red(`✖ Failed to read ${argStr}: ${readRes.content}`));
        }
    }
};

export const writeCommand: Command = {
    name: "/write",
    description: "Write text to a file (or let AI generate it)",
    execute: async (args: string[], ctx: CommandContext) => {
        if (!args[0]) {
            console.log(chalk.red("Usage: /write <file> [prompt or content]"));
            return;
        }
        const file = args[0];
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

        const writeRes = writeFile(file, finalContent, true);
        if (writeRes === "CREATED" || writeRes === "EXISTS") {
            console.log(chalk.green(`✔ Successfully wrote to ${file}`));
            const newHistory = [...ctx.history];
            newHistory.push({
                role: "user",
                content: `I have written content to '${file}'.`
            });
            newHistory.push({
                role: "model",
                content: `Acknowledged.`
            });
            ctx.setHistory(newHistory);
        } else {
            console.log(chalk.red(`✖ Failed to write to ${file}: ${writeRes}`));
        }
    }
};
