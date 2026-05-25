import React from 'react';
import { render } from 'ink';
import ora from 'ora';
import { AppLayout } from '../layout/AppLayout.js';
import { RuntimeContext } from '../../context/runtimeContext.js';
import { ToolExecutor } from '../../tools/executor.js';
import { CommandParser } from '../../utils/commandParser.js';

export async function renderApp() {
    console.clear();
    
    // Initialize exactly as REPL does
    const commandParser = new CommandParser();
    const ctx: RuntimeContext = new RuntimeContext(async (input: string) => {
        return await commandParser.execute(input, ctx);
    });
    const toolExecutor = new ToolExecutor(ctx);

    // Provide a basic loading indicator while MCP initializes
    // In Phase 2 this could be moved inside Ink
    const initSpinner = ora("Initializing MCP servers...").start();
    await Promise.all([
        ctx.initMcp(),
        ctx.initWorkspace(),
        ctx.initGit()
    ]);
    initSpinner.succeed(`Connected to ${ctx.mcp.getServers().length} MCP server(s).`);

    render(<AppLayout ctx={ctx} toolExecutor={toolExecutor} />);
}
