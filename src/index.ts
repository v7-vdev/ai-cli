#!/usr/bin/env node

import { renderApp } from "./ui/renderer/index.js";

const args = process.argv.slice(2);

renderApp();
