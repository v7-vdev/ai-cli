import readline from "readline";
import chalk from "chalk";

import { chatWithAI } from "./providers/groq";
import { readFile } from "./tools/readFile";
import { writeFile } from "./tools/writeFile";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log(chalk.green("AI CLI Started"));
console.log(chalk.yellow("Type 'exit' to quit.\n"));

function askQuestion() {
  rl.question(chalk.blue("You: "), async (input) => {
    if (input.toLowerCase() === "exit") {
      console.log(chalk.red("Goodbye!"));

      rl.close();

      return;
    } else if (input.startsWith("/read ")) {
      const filePath = input.replace("/read ", "");

const result = readFile(filePath);

if (!result.success) {
  console.log(chalk.red("\nERROR: File not found.\n"));
} else {
  console.log(chalk.green("\nFILE CONTENT:\n"));

  console.log(chalk.white(result.content));
}
    } else if (input.startsWith("/generate ")) {
      const args = input.replace("/generate ", "");

      const firstSpace = args.indexOf(" ");

      const filePath = args.substring(0, firstSpace);

      const prompt = args.substring(firstSpace + 1);

      console.log(chalk.yellow("\nGenerating code...\n"));

      const response = await chatWithAI(`
Generate valid code for file: ${filePath}

Task:
${prompt}

Rules:
- Return ONLY raw code
- No markdown
- No explanations
- No triple backticks
`);

      console.log(chalk.green("\nAI GENERATED CODE:\n"));

      console.log(chalk.white(response));

      const result = writeFile(filePath, response);

      if (result === "EXISTS") {
        rl.question(
          chalk.red("\nFile exists. Overwrite? (y/n): "),
          (answer) => {
            if (answer.toLowerCase() === "y") {
              const fs = require("fs");

              fs.writeFileSync(filePath, response);

              console.log(chalk.cyan("\nFile overwritten successfully."));
            } else {
              console.log(chalk.yellow("\nOperation cancelled."));
            }

            console.log("");

            askQuestion();
          },
        );

        return;
      }

      console.log(chalk.cyan("\nFile created successfully."));
    } else {
      const response = await chatWithAI(input);

      console.log(chalk.green("\nAI:\n"));

      console.log(chalk.white(response));
    }

    console.log("");

    askQuestion();
  });
}

askQuestion();
