import chalk from "chalk";
import ora from "ora";
import { Command } from "./command.js";
import { RuntimeContext } from "../context/runtimeContext.js";
import { Planner } from "../planning/planner.js";
import { formatPlan, formatFallback } from "../planning/formatter.js";

export const planCommand: Command = {
    name: "/plan",
    description: "Analyze a requested development task and generate a structured execution plan BEFORE making any changes",
    execute: async (args: string[], ctx: RuntimeContext) => {
        if (args.length === 0) {
            console.log(chalk.red("Usage: /plan <task description>"));
            return;
        }

        const task = args.join(" ");
        ctx.logger.log("INFO", "PLAN", `Starting plan generation for task: ${task}`);

        const spinner = ora(chalk.yellow("Analyzing project structure and generating plan...")).start();

        try {
            const { plan, raw } = await Planner.generatePlan(task, ctx);

            if (plan) {
                spinner.succeed(chalk.green("Plan generated successfully."));
                console.log("\n" + formatPlan(plan));
                ctx.logger.log("INFO", "PLAN", `Successfully generated structured plan.`);
            } else {
                spinner.warn(chalk.yellow("Received a response, but it was malformed. Falling back to plain text."));
                console.log("\n" + formatFallback(raw));
                ctx.logger.log("WARN", "PLAN", `Generated plan was malformed. Used fallback formatter.`);
            }

        } catch (error: any) {
            spinner.fail(chalk.red("Failed to generate plan."));
            console.log(chalk.red(`Error: ${error.message}`));
        }
    }
};
