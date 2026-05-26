import React from 'react';
import { render } from 'ink';
import chalk from 'chalk';
import { AppLayout } from '../layout/AppLayout.js';
import { RuntimeContext } from '../../context/runtimeContext.js';
import { ToolExecutor } from '../../tools/executor.js';
import { CommandParser } from '../../utils/commandParser.js';
import { APP_SUBTITLE } from '../branding/constants.js';

export async function renderApp(isDryRun: boolean = false) {
    console.clear();
    
    // Initialize exactly as REPL does
    const commandParser = new CommandParser();
    const ctx: RuntimeContext = new RuntimeContext(async (input: string) => {
        return await commandParser.execute(input, ctx);
    });
    ctx.pipeline.isDryRun = isDryRun;
    
    const toolExecutor = new ToolExecutor(ctx);

    // Silent initialization
    await Promise.all([
        ctx.initMcp(),
        ctx.initWorkspace(),
        ctx.initGit()
    ]);

    // Render ORK Startup Identity
    const logo = `
 ██████╗ ██████╗ ██╗  ██╗
██╔═══██╗██╔══██╗██║ ██╔╝
██║   ██║██████╔╝█████╔╝
██║   ██║██╔══██╗██╔═██╗
╚██████╔╝██║  ██║██║  ██╗
 ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝
`.trim();

    console.log(chalk.gray(logo));
    console.log(chalk.dim(`${APP_SUBTITLE}\n`));
    
    const w = ctx.workspace?.projectName || 'unknown';
    const p = ctx.provider.constructor.name.replace('Provider', '');
    const b = ctx.git?.branch || 'none';
    
    console.log(chalk.dim(`W: `) + chalk.white(w) + chalk.dim(` | P: `) + chalk.white(p) + chalk.dim(` | B: `) + chalk.white(b));
    console.log(''); // Empty line before orchestration

    render(<AppLayout ctx={ctx} toolExecutor={toolExecutor} />);
}
