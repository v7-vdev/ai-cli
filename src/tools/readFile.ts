import fs from "fs";
import { globalHashCache } from "../execution/hashCache.js";
import { validateWorkspacePath } from "../security/paths.js";

const MAX_READ_SIZE = 1 * 1024 * 1024; // 1MB

export async function readFile(filePath: string) {
  try {
    const absolutePath = validateWorkspacePath(filePath);
    const stats = await fs.promises.stat(absolutePath);

    if (stats.size > MAX_READ_SIZE) {
        // Stream the hash calculation to avoid loading into memory
        const hash = await globalHashCache.calculateHashFile(absolutePath);
        globalHashCache.setHash(absolutePath, hash, true);
        return {
            success: false,
            content: `Error: File is too large (${(stats.size/1024/1024).toFixed(2)}MB). Maximum allowed size for direct AI reading is 1MB. Use shell commands (like 'head' or 'grep') to inspect specific parts if needed. File state cached for write verification.`,
        };
    }

    const content = await fs.promises.readFile(absolutePath, "utf-8");
    globalHashCache.setHash(absolutePath, content);

    return {
      success: true,
      content,
    };
  } catch (err: any) {
    return {
      success: false,
      content: `File not found or unreadable: ${err.message}`,
    };
  }
}
