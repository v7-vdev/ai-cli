export type RiskLevel = "low" | "medium" | "high" | "critical";

interface Risk {
    description: string;
    level: RiskLevel;
}

export function analyzeRiskLevel(warnings: string[]): RiskLevel {
    if (!warnings || warnings.length === 0) return "low";
    
    let maxLevel: RiskLevel = "low";
    for (const w of warnings) {
        const lower = w.toLowerCase();
        if (lower.includes("delete") || lower.includes("drop") || lower.includes("credential") || lower.includes("auth")) {
            return "critical"; // Immediate highest level
        } else if (lower.includes("overwrite") || lower.includes("modify global") || lower.includes("database")) {
            maxLevel = "high";
        } else if (lower.includes("refactor") || lower.includes("dependency") && maxLevel !== "high") {
            maxLevel = "medium";
        }
    }
    return maxLevel;
}
