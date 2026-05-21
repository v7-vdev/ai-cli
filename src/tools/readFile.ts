import fs from "fs";

export function readFile(filePath: string) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");

    return {
      success: true,
      content,
    };
  } catch {
    return {
      success: false,
      content: "File not found.",
    };
  }
}
