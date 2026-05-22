import fs from "fs";
import path from "path";

export function readFile(filePath: string) {
  try {
    const absolutePath = path.resolve(process.cwd(), filePath);
    const content = fs.readFileSync(absolutePath, "utf-8");

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
