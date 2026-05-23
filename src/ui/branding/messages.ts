export const STARTUP_MESSAGES = {
    mcpInit: "Initializing MCP servers...",
    mcpSuccess: (count: number) => `Connected to ${count} MCP server(s).`,
    helpHint: "Type /help for commands\nType /exit to quit",
};

export const SECURITY_NOTES = [
    `Review generated code and planned actions before execution.`,
    `Avoid running untrusted code to mitigate prompt injection risks.`
];
