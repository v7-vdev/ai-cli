import { RuntimeContext } from "../context/runtimeContext.js";
import chalk from "chalk";
import * as p from "@clack/prompts";

export const modelCommand = {
    name: "/model",
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
                let modelName = args[1];
                if (!modelName) {
                    const provider = ctx.registry.getActiveProvider();
                    const models = provider.getAvailableModels();
                    const activeModel = ctx.registry.getActiveModel();
                    
                    const selected = await p.select({
                        message: "Select a model to switch to:",
                        options: models.map(m => ({ 
                            value: m.value, 
                            label: m.value === activeModel ? `${m.label} (active)` : m.label 
                        }))
                    });
                    
                    if (p.isCancel(selected)) return;
                    modelName = selected as string;
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
