import { RuntimeContext } from "../context/runtimeContext.js";

export interface Command {
    name: string;
    description: string;
    execute: (args: string[], ctx: RuntimeContext) => Promise<void>;
}
