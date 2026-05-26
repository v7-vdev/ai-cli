import { isProtectedPath } from "./protected.js";
import { isHighRiskCommand } from "../security/commands.js";
import { isIndirectExecution } from "../security/interpreters.js";

type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface RiskAnalysis {
    level: RiskLevel;
    reason: string;
}

export function analyzeFileRisk(filePath: string, operation: "read" | "write" | "delete", contentSize?: number): RiskAnalysis {
    const protectedCheck = isProtectedPath(filePath);
    if (protectedCheck.isProtected) {
        return {
            level: "HIGH",
            reason: protectedCheck.reason || `Attempting to ${operation} protected file: ${filePath}`
        };
    }
    if (operation === "delete") {
        return {
            level: "HIGH",
            reason: "Deleting files is a high risk operation"
        };
    }
    
    // Large file overwrites might be risky
    if (operation === "write" && contentSize && contentSize > 50000) { // 50KB+
        return {
            level: "MEDIUM",
            reason: "Writing a large amount of content"
        };
    }

    return {
        level: "LOW",
        reason: "Standard file modification on a safe path"
    };
}

export function analyzeCommandRisk(command: string, modifiedFiles?: Set<string>): RiskAnalysis {
    const highRiskReason = isHighRiskCommand(command);
    if (highRiskReason) {
        return {
            level: "HIGH",
            reason: highRiskReason
        };
    }
    
    if (modifiedFiles) {
        const indirectReason = isIndirectExecution(command, modifiedFiles);
        if (indirectReason) {
            return {
                level: "HIGH",
                reason: indirectReason
            };
        }
    }

    const cmd = command.trim().toLowerCase();
    
    // Git mutations
    if (cmd.startsWith("git commit") || cmd.startsWith("git push") || cmd.startsWith("git reset") || cmd.startsWith("git checkout") || cmd.startsWith("git merge")) {
        return {
            level: "MEDIUM",
            reason: "Git repository mutation detected"
        };
    }

    // Setup or heavy install commands
    if (cmd.startsWith("npm install") || cmd.startsWith("yarn ") || cmd.startsWith("pnpm ") || cmd.startsWith("npm run build")) {
        return {
            level: "MEDIUM",
            reason: "Command may perform dependency changes or heavy build operations"
        };
    }

    return {
        level: "LOW",
        reason: "Command appears to be safe"
    };
}
