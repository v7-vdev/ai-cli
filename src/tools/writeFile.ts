import fs from "fs";
import path from "path";

export function writeFile(filePath: string, content: string, overwrite = false) {
  try {
    const absolutePath = path.resolve(process.cwd(), filePath);
    const fileExists = fs.existsSync(absolutePath);

    if (fileExists && !overwrite) {
      return "EXISTS";
    }

    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(absolutePath, content);

    return "CREATED";
  } catch (err: any) {
    return `ERROR: ${err.message}`;
  }
}
