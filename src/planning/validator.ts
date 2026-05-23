import { RuntimeContext } from "../context/runtimeContext.js";

export interface PlanData {
    objective: string;
    filesAffected: string[];
    steps: string[];
    commands: string[];
    warnings: string[];
    complexity: string;
    nextAction: string;
}

export class Validator {
    static validatePlan(rawResponse: string, ctx: RuntimeContext): PlanData | null {
        try {
            // Pre-parsing: Strip markdown code fences
            let jsonStr = rawResponse.trim();
            
            // Handle markdown fences
            if (jsonStr.startsWith("```")) {
                const lines = jsonStr.split('\n');
                if (lines[0]?.startsWith("```")) {
                    lines.shift(); // Remove first line (e.g. ```json)
                }
                if (lines[lines.length - 1]?.startsWith("```")) {
                    lines.pop(); // Remove last line
                }
                jsonStr = lines.join('\n').trim();
            }

            const parsed = JSON.parse(jsonStr);

            // Validation behavior: Validate required sections exist
            // Fallback to empty arrays/strings for partial recovery
            const plan: PlanData = {
                objective: typeof parsed.objective === 'string' ? parsed.objective : "No objective provided.",
                filesAffected: Array.isArray(parsed.filesAffected) ? parsed.filesAffected : [],
                steps: Array.isArray(parsed.steps) ? parsed.steps : [],
                commands: Array.isArray(parsed.commands) ? parsed.commands : [],
                warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
                complexity: typeof parsed.complexity === 'string' ? parsed.complexity : "Unknown",
                nextAction: typeof parsed.nextAction === 'string' ? parsed.nextAction : "None"
            };

            // Reject empty plans safely
            if (plan.objective === "No objective provided." && plan.steps.length === 0) {
                throw new Error("Plan appears to be empty or malformed.");
            }

            return plan;

        } catch (error: any) {
            ctx.logger.log("ERROR", "PLAN_VALIDATION", `Failed to parse plan JSON: ${error.message}`);
            return null; // Return null to trigger fallback
        }
    }
}
