import chalk from "chalk";
import ora from "ora";
import { Command } from "./command.js";
import { RuntimeContext } from "../context/runtimeContext.js";
import { runCommand as runCmd } from "../tools/runCommand.js";

export const runCommand: Command = {
    name: "/run",
    description: "Run a terminal command and add output to context",
    execute: async (args: string[], ctx: RuntimeContext) => {
        const argStr = args.join(" ");
        if (!argStr) {
            console.log(chalk.red("Usage: /run <command>"));
            return;
        }
        const runSpinner = ora(`Running: ${argStr}`).start();
        const runRes = await runCmd(argStr);
        
        if (runRes.success) {
            runSpinner.succeed(`Finished: ${argStr}`);
            console.log(chalk.gray(runRes.output || ""));
        } else {
            runSpinner.fail(`Failed: ${argStr}`);
            console.log(chalk.red(runRes.output || ""));
        }
        
        ctx.addMessage({
            role: "user",
            content: `I ran the command '${argStr}' and got this output:\n\n${runRes.output || ""}`
        });
        ctx.addMessage({
            role: "model",
            content: `I have received the command output.`
        });
    }
};
