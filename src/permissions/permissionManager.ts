import chalk from "chalk";
import { select, isCancel } from "@clack/prompts";

import { AuditLogger } from "../logs/auditLogger.js";

export type ActionType = "readFile" | "writeFile" | "runCommand" | "mcp";

export class PermissionManager {
    private alwaysAllowCache: Set<string> = new Set();
    private logger: AuditLogger;

    constructor(logger: AuditLogger) {
        this.logger = logger;
    }

    private getCacheKey(action: ActionType, metadata: any): string {
        if (action === "mcp") {
            return `mcp:${metadata.serverName}:${metadata.toolName}`;
        } else if (action === "writeFile") {
            return `writeFile:${metadata.path}`;
        } else if (action === "runCommand") {
            return `runCommand:${metadata.command}`;
        }
        return `${action}:${JSON.stringify(metadata)}`;
    }

    private checkHeuristics(action: ActionType, metadata: any): string | null {
        if (action === "runCommand") {
            const cmd = (metadata.command || "").toLowerCase();
            if (cmd.includes("rm -rf /") || cmd.includes("rm -rf /*")) {
                return "Blocked: Dangerous shell command detected.";
            }
        }
        if (action === "writeFile") {
            if (!metadata.content || metadata.content.trim() === "") {
                return "Blocked: Attempting to write empty content to file.";
            }
        }
        return null; // OK
    }

    public async requestPermission(action: ActionType, metadata: any): Promise<boolean> {
        // Safe defaults
        if (action === "readFile") {
            return true; // Read is safe
        }

        const heuristicsError = this.checkHeuristics(action, metadata);
        if (heuristicsError) {
            console.log(chalk.red(`\n[Safety Check] ${heuristicsError}`));
            this.logger.log("SECURITY", "PERMISSION", `Blocked Action: ${action} - ${heuristicsError}`);
            return false;
        }

        const cacheKey = this.getCacheKey(action, metadata);
        if (this.alwaysAllowCache.has(cacheKey)) {
            this.logger.log("INFO", "PERMISSION", `Auto-allowed action (cached): ${action} ${JSON.stringify(metadata)}`);
            return true;
        }

        let message = "";
        if (action === "writeFile") {
            message = `Allow AI to overwrite/write to '${metadata.path}'?`;
        } else if (action === "runCommand") {
            message = `Allow AI to execute command: '${metadata.command}'?`;
        } else if (action === "mcp") {
            message = `Allow AI to use MCP tool '${metadata.toolName}' on '${metadata.serverName}'?`;
        } else {
            message = `Allow AI to perform action: ${action}?`;
        }

        this.logger.log("INFO", "PERMISSION", `Prompting user for action: ${action} ${JSON.stringify(metadata)}`);

        const response = await select({
            message: chalk.red.bold(message),
            options: [
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
                { value: "always", label: "Always allow for session" }
            ]
        });

        if (isCancel(response) || response === "no") {
            this.logger.log("WARN", "PERMISSION", `User denied action: ${action}`);
            return false;
        }

        if (response === "always") {
            this.logger.log("INFO", "PERMISSION", `User always allowed action: ${action}`);
            this.alwaysAllowCache.add(cacheKey);
            return true;
        }

        this.logger.log("INFO", "PERMISSION", `User approved action once: ${action}`);
        return response === "yes";
    }
}
