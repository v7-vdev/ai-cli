import fs from "fs";

export function writeFile(filePath: string, content: string) {
  const fileExists = fs.existsSync(filePath);

  if (fileExists) {
    return "EXISTS";
  }

  fs.writeFileSync(filePath, content);

  return "CREATED";
}
