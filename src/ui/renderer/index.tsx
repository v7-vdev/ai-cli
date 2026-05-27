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

    console.log(chalk.dim.gray(logo));
    console.log('');
    console.log(chalk.dim.gray(`${APP_SUBTITLE}\n`));
    
    const w = ctx.workspace?.projectName || 'unknown';
    const p = ctx.provider.constructor.name.replace('Provider', '');
    const b = ctx.git?.branch || 'none';
    
    console.log(chalk.dim(`W: `) + chalk.white(w) + chalk.dim(` | P: `) + chalk.white(p) + chalk.dim(` | B: `) + chalk.white(b));
    console.log(''); // Empty line before orchestration

    const { unmount, clear } = render(<AppLayout ctx={ctx} toolExecutor={toolExecutor} />, { exitOnCtrlC: false });

    let shutdownInProgress = false;
    let ctrlCPressedOnce = false;
    let ctrlCTimer: NodeJS.Timeout | null = null;

    const handleGracefulShutdown = async () => {
        if (shutdownInProgress) return;

        if (!ctrlCPressedOnce) {
            // First Ctrl+C: abort active orchestration, but keep REPL alive
            ctrlCPressedOnce = true;
            ctx.abortController.abort(); // Cancel streams immediately
            // Re-create a fresh abort controller for the next execution
            ctx.abortController = new AbortController();
            
            if (ctx.pipeline) {
                ctx.pipeline.abort();
            }

            console.log(chalk.yellow('\n⚠ Orchestration interrupted. Press Ctrl+C again to exit.'));

            ctrlCTimer = setTimeout(() => {
                ctrlCPressedOnce = false;
            }, 2000); // 2 second window for double Ctrl+C
            return;
        }

        // Second Ctrl+C: Hard shutdown
        shutdownInProgress = true;
        if (ctrlCTimer) clearTimeout(ctrlCTimer);
        
        console.log(chalk.red('\n✖ Shutting down ORK runtime...'));
        clear();
        unmount();
        await ctx.shutdown(true);
        
        // Ensure cursor is visible and terminal is sane before exiting
        process.stdout.write('\x1B[?25h'); // Show cursor
        process.stdout.write('\x1B[0m');   // Reset formatting
        process.stdout.write('\x1B[?1049l'); // Leave alternate screen buffer (if any)
        
        process.exit(0);
    };

    process.on('SIGINT', handleGracefulShutdown);
    process.on('SIGTERM', handleGracefulShutdown);
}
