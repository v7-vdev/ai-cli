#!/usr/bin/env node

import { REPL } from "./repl.js";
import { renderApp } from "./ui/renderer/index.js";

const args = process.argv.slice(2);

if (args.includes('--legacy')) {
    const cli = new REPL();
    cli.start();
} else {
    renderApp();
}
