import { RuntimeContext } from "../context/runtimeContext.js";
import chalk from "chalk";

export const modelCommand = {
    name: "model",
    description: "Manage and switch models for the active provider",
    execute: async (args: string[], ctx: RuntimeContext) => {
        if (args.length === 0) {
            console.log(chalk.yellow("Usage: /model <list|switch> [modelName]"));
            return;
        }

        const action = args[0];

        switch (action) {
            case "list": {
                const provider = ctx.registry.getActiveProvider();
                const activeModel = ctx.registry.getActiveModel();
                const models = provider.getAvailableModels();
                
                console.log(chalk.cyan(`\nAvailable Models for ${ctx.registry.getActiveProviderId()}:`));
                for (const m of models) {
                    const prefix = m.value === activeModel ? chalk.green("→ ") : "  ";
                    console.log(`${prefix}${m.label} (${m.value})`);
                }
                console.log("");
                break;
            }
            case "switch": {
                const modelName = args[1];
                if (!modelName) {
                    console.log(chalk.red("Model name required."));
                    return;
                }
                ctx.registry.switchModel(modelName);
                break;
            }
            default: {
                console.log(chalk.red(`Unknown action: ${action}`));
            }
        }
    }
};
