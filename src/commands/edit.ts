import chalk from "chalk";
import ora from "ora";
import fs from "fs";
import { confirm, isCancel } from "@clack/prompts";
import * as diff from "diff";
import { Command } from "./command.js";
import { RuntimeContext } from "../context/runtimeContext.js";
import { readFile } from "../tools/readFile.js";
import { writeFile } from "../tools/writeFile.js";

export const editCommand: Command = {
    name: "/edit",
    description: "Edit an existing file using AI",
    execute: async (args: string[], ctx: RuntimeContext) => {
        if (args.length < 2) {
            console.log(chalk.red("Usage: /edit <file> <instruction>"));
            return;
        }

        const file = args[0] as string;
        const instruction = args.slice(1).join(" ");

        if (!fs.existsSync(file)) {
            console.log(chalk.red(`✖ File '${file}' does not exist.`));
            return;
        }

        const readRes = readFile(file);
        if (!readRes.success) {
            console.log(chalk.red(`✖ Failed to read ${file}: ${readRes.content}`));
            return;
        }

        const originalContent = readRes.content;
        
        if (!originalContent.trim()) {
            console.log(chalk.yellow(`⚠ File '${file}' is empty. Use /write or /generate instead.`));
            return;
        }

        const editSpinner = ora("AI is editing the file...").start();
        
        const tempHistory = [...ctx.history, {
            role: "user" as const,
            content: `Edit the following file based on this instruction: ${instruction}\n\nOriginal File:\n\`\`\`\n${originalContent}\n\`\`\`\n\nReturn ONLY the FULL updated file content. Do not include markdown formatting blocks (like \`\`\`), do not include explanations, and preserve the original encoding/indentation.`
        }];

        const genRes = await ctx.provider.chat(tempHistory);
        editSpinner.stop();

        const newContent = String(genRes.text || "");

        // Safety checks
        if (!newContent.trim()) {
            console.log(chalk.red("✖ AI returned an empty response. Edit aborted."));
            return;
        }

        if (newContent.length < originalContent.length * 0.2) {
            console.log(chalk.red("✖ AI returned a suspiciously short response. Edit aborted."));
            return;
        }

        // Compute diff
        const changes = diff.diffLines(originalContent, newContent);
        console.log(chalk.bold.cyan(`\nProposed changes for ${file}:\n`));
        
        let hasChanges = false;
        changes.forEach((part) => {
            if (part.added) {
                process.stdout.write(chalk.green(part.value));
                hasChanges = true;
            } else if (part.removed) {
                process.stdout.write(chalk.red(part.value));
                hasChanges = true;
            } else {
                // optionally print unchanged lines with chalk.gray, but for large files it's noisy.
                // We'll just print a small context or omit unchanged lines.
                // For simplicity, we just print a small placeholder if we skip.
            }
        });

        if (!hasChanges) {
            console.log(chalk.yellow("No changes proposed by AI."));
            return;
        }

        console.log("\n");

        const shouldApply = await confirm({
            message: chalk.yellow.bold(`Apply these changes to '${file}'? (This will create a .bak backup)`),
            initialValue: false
        });

        if (isCancel(shouldApply) || !shouldApply) {
            console.log(chalk.yellow("✖ Edit cancelled."));
            return;
        }

        // Create backup
        try {
            fs.writeFileSync(`${file}.bak`, originalContent, "utf-8");
            console.log(chalk.gray(`Created backup at ${file}.bak`));
        } catch (err: any) {
            console.log(chalk.red(`✖ Failed to create backup: ${err.message}`));
            return; // Abort if backup fails
        }

        // Overwrite
        const writeRes = writeFile(file, newContent, true);
        if (writeRes === "CREATED" || writeRes === "EXISTS") {
            console.log(chalk.green(`✔ Successfully edited ${file}`));
            ctx.addMessage({
                role: "user",
                content: `I have applied the following edit to '${file}': ${instruction}`
            });
            ctx.addMessage({
                role: "model",
                content: `Acknowledged.`
            });
        } else {
            console.log(chalk.red(`✖ Failed to write edit to ${file}: ${writeRes}`));
        }
    }
};
