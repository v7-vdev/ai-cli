import { select, isCancel } from "@clack/prompts";
import chalk from "chalk";
import { Command } from "./command.js";
import { RuntimeContext } from "../context/runtimeContext.js";

export const modelsCommand: Command = {
    name: "/models",
    description: "Interactive model selection menu",
    execute: async (args: string[], ctx: RuntimeContext) => {
        const availableModels = ctx.provider.getAvailableModels();
        const selectedModel = await select({
            message: "Select a model:",
            options: availableModels,
        });
        
        if (isCancel(selectedModel)) {
            console.log(chalk.yellow("Model selection cancelled."));
            return;
        }
        
        ctx.provider.setModel(selectedModel as string);
        console.log(chalk.green(`✔ Model set to: ${selectedModel}`));
    }
};
