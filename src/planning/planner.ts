import { RuntimeContext } from "../context/runtimeContext.js";
import { Validator, PlanData } from "./validator.js";

export class Planner {
    static async generatePlan(task: string, ctx: RuntimeContext): Promise<{ plan: PlanData | null, raw: string }> {
        let workspaceContext = "No workspace metadata available.";
        if (ctx.workspace) {
            workspaceContext = `
Workspace Name: ${ctx.workspace.projectName}
Root Path: ${ctx.workspace.projectRoot}
Frameworks Detected: ${ctx.workspace.frameworks.map(f => f.name).join(', ') || 'None'}
Package Manager: ${ctx.workspace.packageManager}
Important Folders: ${ctx.workspace.importantFolders.join(', ')}
`;
        }

        const systemPrompt = `You are an expert technical planning assistant. Analyze the user's task and generate a structured execution plan BEFORE making any changes.
You MUST tailor your plan to the actual structure of the user's workspace.

=== Workspace Context ===
${workspaceContext}
=========================

DO NOT provide markdown text outside of the JSON block. Return ONLY a JSON object with the following schema:
{
    "objective": "A summary of the goal",
    "filesAffected": ["exact/path/to/file1.ts"],
    "steps": ["step 1", "step 2"],
    "commands": ["npm install x"],
    "warnings": ["warning 1 about risk"],
    "complexity": "Low/Medium/High",
    "nextAction": "What the user should do next"
}`;

        const messages = [
            { role: "system" as const, content: systemPrompt },
            { role: "user" as const, content: `Task: ${task}\n\nAnalyze this task and generate the JSON plan aligning precisely with the detected workspace structure.` }
        ];

        // Timeout protection
        const timeoutMs = 30000; // 30 seconds
        
        try {
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error(`Plan generation timed out after ${timeoutMs}ms`)), timeoutMs);
            });

            const chatPromise = ctx.provider.chat(messages);
            
            const response = await Promise.race([chatPromise, timeoutPromise]);
            
            const rawResponse = response.text || "";
            const plan = Validator.validatePlan(rawResponse, ctx);

            return { plan, raw: rawResponse };

        } catch (error: any) {
            ctx.logger.log("ERROR", "PLANNER", error.message);
            throw error;
        }
    }
}
