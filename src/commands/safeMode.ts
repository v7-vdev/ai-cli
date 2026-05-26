import { Command } from "./command.js";
import { RuntimeContext } from "../context/runtimeContext.js";

export const safeModeCommand: Command = {
    name: "/safe-mode",
    description: "Toggle safe mode (blocks all mutating operations)",
    execute: async (args: string[], ctx: RuntimeContext) => {
        ctx.pipeline.isSafeMode = !ctx.pipeline.isSafeMode;
        ctx.addMessage({
            role: "model",
            content: ctx.pipeline.isSafeMode 
                ? "⚠️ **SAFE MODE ACTIVE**: All mutating operations (writes, commands, external tools) will be strictly blocked."
                : "✅ **SAFE MODE DEACTIVATED**: Operations can now mutate the filesystem and run commands (subject to normal approval)."
        });
    }
};
