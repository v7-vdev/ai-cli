import * as diff from "diff";
import fs from "fs";

export interface DiffResult {
    isLarge: boolean;
    diffLines?: string[];
    summary?: string;
}

const MAX_DIFF_LINES = 100;
const MAX_DIFF_LENGTH = 10000;

export function generateDiff(filePath: string, newContent: string): DiffResult {
    let oldContent = "";
    try {
        if (fs.existsSync(filePath)) {
            oldContent = fs.readFileSync(filePath, "utf-8");
        }
    } catch (e) {
        // file unreadable or doesn't exist
    }

    // Protect against freezing on massive strings (5MB Hard cutoff)
    const newSizeMb = newContent.length / (1024 * 1024);
    if (newSizeMb > 5 || oldContent.length > 5 * 1024 * 1024) {
        return {
            isLarge: true,
            summary: `WARNING: Large/Binary File Overwrite Warning\nTarget size: ${newSizeMb.toFixed(2)} MB. Granular diff preview unavailable.\nApproval required before overwrite.`
        };
    }

    if (newContent.length > 1024 * 1024 || oldContent.length > 1024 * 1024) {
        return {
            isLarge: true,
            summary: `File too large for inline diff. Target size: ${(newContent.length / 1024 / 1024).toFixed(2)} MB.`
        };
    }

    const changes = diff.diffLines(oldContent, newContent);
    const diffLines: string[] = [];
    
    let added = 0;
    let removed = 0;
    let diffLength = 0;

    for (const change of changes) {
        const lines = change.value.split('\n');
        if (lines[lines.length - 1] === '') {
            lines.pop(); // remove trailing empty string
        }
        
        for (const line of lines) {
            let formattedLine = "";
            if (change.added) {
                formattedLine = `+ ${line}`;
                added++;
            } else if (change.removed) {
                formattedLine = `- ${line}`;
                removed++;
            } else {
                formattedLine = `  ${line}`;
            }
            
            diffLines.push(formattedLine);
            diffLength += formattedLine.length;
        }
    }

    if (diffLines.length > MAX_DIFF_LINES || diffLength > MAX_DIFF_LENGTH) {
        return {
            isLarge: true,
            summary: `Large diff detected. Added ${added} lines, removed ${removed} lines. Preview truncated for performance.`
        };
    }

    return {
        isLarge: false,
        diffLines
    };
}
