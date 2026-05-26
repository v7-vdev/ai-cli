import chalk from "chalk";
import { Command } from "./command.js";
import { RuntimeContext } from "../context/runtimeContext.js";

export const runCommand: Command = {
    name: "/run",
    description: "Run a terminal command and add output to context",
    execute: async (args: string[], ctx: RuntimeContext) => {
        const isDryRun = args.includes("--dry-run") || args.includes("--preview-only");
        
        // Filter out the flags from the actual command
        const commandArgs = args.filter(a => a !== "--dry-run" && a !== "--preview-only");
        const argStr = commandArgs.join(" ");

        if (!argStr) {
            console.log(chalk.red("Usage: /run [--dry-run] <command>"));
            return;
        }

        const originalDryRun = ctx.pipeline.isDryRun;
        if (isDryRun) {
            ctx.pipeline.isDryRun = true;
        }

        // We use the pipeline for execution to get risk classification, diffing, and dry-run benefits
        const output = await ctx.pipeline.executeRunCommand(argStr);

        // Restore global dry run state
        ctx.pipeline.isDryRun = originalDryRun;
        
        ctx.addMessage({
            role: "user",
            content: `I ran the command '${argStr}' and got this output:\n\n${output}`
        });
        ctx.addMessage({
            role: "model",
            content: `I have received the command output.`
        });
    }
};
