import chalk from "chalk";
import fs from "fs";
import readline from "readline";
import { Command } from "./command.js";
import { RuntimeContext } from "../context/runtimeContext.js";

export const logsCommand: Command = {
    name: "/logs",
    description: "Manage and view execution audit logs",
    execute: async (args: string[], ctx: RuntimeContext) => {
        const action = args[0] || "show";
        const logFilePath = ctx.logger.getLogFilePath();

        if (action === "clear") {
            try {
                fs.writeFileSync(logFilePath, "");
                console.log(chalk.green(`✔ Audit logs cleared.`));
                ctx.logger.log("INFO", "SYSTEM", "Logs cleared by user.");
            } catch (err: any) {
                console.log(chalk.red(`✖ Failed to clear logs: ${err.message}`));
            }
            return;
        }

        if (!fs.existsSync(logFilePath)) {
            console.log(chalk.yellow("No logs found."));
            return;
        }

        if (action === "show") {
            try {
                const content = fs.readFileSync(logFilePath, "utf8");
                const lines = content.split("\n").filter(l => l.trim() !== "");
                const lastLines = lines.slice(-20); // Show last 20 lines
                if (lastLines.length === 0) {
                    console.log(chalk.gray("Log is empty."));
                } else {
                    console.log(chalk.cyan(`\n--- Last ${lastLines.length} Audit Logs ---`));
                    lastLines.forEach(line => {
                        if (line.includes("[ERROR]") || line.includes("[SECURITY]")) {
                            console.log(chalk.red(line));
                        } else if (line.includes("[WARN]")) {
                            console.log(chalk.yellow(line));
                        } else {
                            console.log(chalk.gray(line));
                        }
                    });
                    console.log(chalk.cyan("----------------------------\n"));
                }
            } catch (err: any) {
                console.log(chalk.red(`✖ Failed to read logs: ${err.message}`));
            }
            return;
        }

        if (action === "tail") {
            console.log(chalk.cyan(`Tailing logs... (Press Ctrl+C to stop)`));
            
            return new Promise<void>((resolve) => {
                let currentSize = fs.statSync(logFilePath).size;
                
                const interval = setInterval(() => {
                    try {
                        const stats = fs.statSync(logFilePath);
                        if (stats.size > currentSize) {
                            const stream = fs.createReadStream(logFilePath, { start: currentSize, encoding: 'utf8' });
                            stream.on('data', (chunk: string | Buffer) => {
                                const chunkStr = chunk.toString();
                                const lines = chunkStr.split('\n').filter((l: string) => l.trim() !== "");
                                lines.forEach((line: string) => {
                                    if (line.includes("[ERROR]") || line.includes("[SECURITY]")) {
                                        console.log(chalk.red(line));
                                    } else if (line.includes("[WARN]")) {
                                        console.log(chalk.yellow(line));
                                    } else {
                                        console.log(chalk.gray(line));
                                    }
                                });
                            });
                            currentSize = stats.size;
                        } else if (stats.size < currentSize) {
                            // File was truncated or rotated
                            currentSize = stats.size;
                        }
                    } catch (e) {
                        // File might be missing briefly during rotation
                    }
                }, 500);

                const rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });

                rl.on('SIGINT', () => {
                    clearInterval(interval);
                    rl.close();
                    console.log(chalk.yellow("\nStopped tailing logs."));
                    resolve();
                });
            });
        }

        console.log(chalk.red(`Usage: /logs [show|tail|clear]`));
    }
};
