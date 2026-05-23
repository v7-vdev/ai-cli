import chalk from "chalk";
import boxen from "boxen";
import { PlanData } from "./validator.js";
import { analyzeRiskLevel } from "./riskAnalysis.js";

export function formatPlan(plan: PlanData): string {
    let output = "";

    const title = chalk.cyan.bold("📋 Execution Plan");
    output += boxen(title, { padding: 0.5, borderColor: "cyan", borderStyle: "round" }) + "\n\n";

    output += chalk.blue.bold("Objective:\n") + chalk.white(plan.objective) + "\n\n";

    if (plan.filesAffected && plan.filesAffected.length > 0) {
        output += chalk.magenta.bold("Files Likely Affected:\n");
        plan.filesAffected.forEach(f => output += chalk.gray("  • ") + chalk.yellow(f) + "\n");
        output += "\n";
    }

    if (plan.steps && plan.steps.length > 0) {
        output += chalk.green.bold("Step-by-Step Plan:\n");
        plan.steps.forEach((s, i) => output += chalk.gray(`  ${i + 1}. `) + chalk.white(s) + "\n");
        output += "\n";
    }

    if (plan.commands && plan.commands.length > 0) {
        output += chalk.cyan.bold("Commands Needed:\n");
        plan.commands.forEach(c => output += chalk.gray("  $ ") + chalk.white(c) + "\n");
        output += "\n";
    }

    if (plan.warnings && plan.warnings.length > 0) {
        const risk = analyzeRiskLevel(plan.warnings);
        let riskColor = chalk.white;
        if (risk === "critical") riskColor = chalk.red.bold;
        else if (risk === "high") riskColor = chalk.red;
        else if (risk === "medium") riskColor = chalk.yellow;
        else riskColor = chalk.green;

        output += riskColor(`Risks / Warnings (Level: ${risk.toUpperCase()}):\n`);
        plan.warnings.forEach(w => output += chalk.gray("  ! ") + riskColor(w) + "\n");
        output += "\n";
    }

    if (plan.complexity) {
        output += chalk.blueBright.bold("Estimated Complexity: ") + chalk.white(plan.complexity) + "\n\n";
    }

    if (plan.nextAction) {
        output += chalk.greenBright.bold("Recommended Next Action:\n") + chalk.white(plan.nextAction) + "\n";
    }

    return output;
}

export function formatFallback(rawResponse: string): string {
    let output = "";
    const title = chalk.yellow.bold("📋 Execution Plan (Plain Text)");
    output += boxen(title, { padding: 0.5, borderColor: "yellow", borderStyle: "round" }) + "\n\n";
    output += chalk.white(rawResponse) + "\n";
    return output;
}
