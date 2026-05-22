import chalk from "chalk";
import ora from "ora";
import { Command } from "./command.js";
import { RuntimeContext } from "../context/runtimeContext.js";
import { writeFile } from "../tools/writeFile.js";

export const generateCommand: Command = {
    name: "/generate",
    description: "Generate code and write to a file",
    execute: async (args: string[], ctx: RuntimeContext) => {
        if (args.length < 2) {
            console.log(chalk.red("Usage: /generate <file> <prompt>"));
            return;
        }
        
        const file = args[0] as string;
        const prompt = args.slice(1).join(" ");
        
        const genSpinner = ora("Generating code...").start();
        const tempHistory = [...ctx.history, {
            role: "user" as const,
            content: `Generate code for file ${file}. Task: ${prompt}. Return ONLY the raw code without markdown blocks or explanations.`
        }];
        
        const genRes = await ctx.provider.chat(tempHistory);
        const finalContent = String(genRes.text || "");
        genSpinner.succeed("Code generated.");

        const writeRes = writeFile(file, finalContent, true);
        if (writeRes === "CREATED" || writeRes === "EXISTS") {
            console.log(chalk.green(`✔ Successfully wrote generated code to ${file}`));
            ctx.addMessage({
                role: "user",
                content: `I have generated code for task '${prompt}' and written it to '${file}'.`
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
