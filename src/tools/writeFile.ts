import fs from "fs";
import path from "path";
import { globalHashCache } from "../execution/hashCache.js";
import { validateWorkspacePath } from "../security/paths.js";
import { writeAtomic } from "../utils/fs.js";

export async function writeFile(filePath: string, content: string, overwrite = false) {
  try {
    const absolutePath = validateWorkspacePath(filePath);
    const fileExists = fs.existsSync(absolutePath);

    if (fileExists && !overwrite) {
      return "EXISTS";
    }

    if (fileExists && overwrite) {
        const currentContent = await fs.promises.readFile(absolutePath, "utf-8");
        const currentHash = globalHashCache.calculateHash(currentContent);
        const expectedHash = globalHashCache.getHash(absolutePath);
        
        if (expectedHash && currentHash !== expectedHash) {
            return "ERROR: File changed externally before execution. High risk of TOCTOU overwrite. Please read the file again to sync state before writing.";
        }
    }

    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await writeAtomic(absolutePath, content);
    globalHashCache.setHash(absolutePath, content);

    return fileExists ? "UPDATED" : "CREATED";
  } catch (err: any) {
    return `ERROR: ${err.message}`;
  }
}
