import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function runCommand(command: string): Promise<{ success: boolean; output: string }> {
    try {
        const { stdout, stderr } = await execAsync(command, { cwd: process.cwd() });
        const output = stdout || stderr;
        return {
            success: true,
            output: output.trim(),
        };
    } catch (err: any) {
        return {
            success: false,
            output: err.message || "Command failed.",
        };
    }
}
