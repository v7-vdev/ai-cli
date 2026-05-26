#!/usr/bin/env node

import { renderApp } from "./ui/renderer/index.js";

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run") || args.includes("--preview-only");

renderApp(isDryRun);
