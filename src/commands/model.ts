import { Command } from "./command.js";
import { RuntimeContext } from "../context/runtimeContext.js";
import chalk from "chalk";

export const modelCommand: Command = {
    name: "/model",
    description: "Manage AI models (switch)",
    execute: async (args: string[], ctx: RuntimeContext) => {
        const action = args[0] || "switch";
        
        if (action === "switch") {
            let targetModel = args[1];
            
            if (!targetModel) {
                if (!ctx.requestMenuSelection) {
                    console.log(chalk.yellow("Usage: /model switch <model_name>"));
                    return;
                }

                const provider = ctx.registry.getActiveProvider();
                const models = provider.getAvailableModels();

                const selected = await ctx.requestMenuSelection("Select a model:", 
                    models.map((m: any) => ({ value: m.value, label: m.label }))
                );
                
                if (!selected) return;
                targetModel = selected;
            }

            if (targetModel) {
                try {
                    ctx.registry.switchModel(targetModel);
                    console.log(chalk.green(`Successfully switched to model: ${targetModel}`));
                } catch (e: any) {
                    console.log(chalk.red(`Switch failed: ${e.message}`));
                }
            }
        } else {
            console.log(chalk.yellow("Unknown action. Available: switch"));
        }
    }
};
