const BLOCKED_SHELL_OPERATORS = ["&&", "||", "|", ">", "<", ";", "$(", "`"];

const HIGH_RISK_COMMANDS = [
    "rm -rf",
    "sudo ",
    "chmod 777",
    "git push --force",
    "git reset --hard",
    "mkfs",
    "dd "
];

export function hasShellOperators(command: string): boolean {
    return BLOCKED_SHELL_OPERATORS.some(op => command.includes(op));
}

export function isHighRiskCommand(command: string): string | null {
    const cmd = command.toLowerCase();
    
    for (const risk of HIGH_RISK_COMMANDS) {
        if (cmd.includes(risk)) {
            return `Destructive command pattern detected: ${risk}`;
        }
    }

    if (hasShellOperators(command)) {
        return "Shell operators (chaining, piping, redirection) are blocked for safety. Please run simple sequential commands.";
    }

    // Default rm checks
    if (cmd.startsWith("rm ") || cmd.includes(" rm ") || cmd.startsWith("del ")) {
        return "Destructive command detected (e.g., rm, del)";
    }

    return null;
}
