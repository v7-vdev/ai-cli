import { Command } from "./command.js";
import { RuntimeContext } from "../context/runtimeContext.js";

export const interactiveCommand: Command = {
    name: "/commands",
    description: "Interactive command menu",
    execute: async (args: string[], ctx: RuntimeContext) => {
        const commandsList = `**Available Commands:**
- \`/read <path>\` - Read a file into context
- \`/write <path>\` - Write text to a file
- \`/generate <path>\` - Generate code and write to a file
- \`/edit <path>\` - Edit an existing file safely with AI
- \`/run <command>\` - Run a terminal command
- \`/logs\` - Manage audit logs (show/tail/clear)
- \`/provider switch <id>\` - Change AI provider (e.g. openrouter, groq, anthropic)
- \`/model switch <name>\` - Change active AI model
- \`/mcp\` - Manage MCP Servers
- \`/clear\` - Clear conversation history
- \`/exit\` - Quit the CLI

*Note: Type a command followed by its arguments directly into the input.*`;

        ctx.addMessage({ role: 'system', content: commandsList });
    }
};
