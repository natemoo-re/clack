import * as p from "@clack/prompts";
import color from "picocolors";
import { setTimeout } from "node:timers/promises";

async function main() {
  console.clear();

  p.intro(`${color.bgCyan(color.black(" clack.cc "))}`);

  const project = await p.group(
    {
      path: () =>
        p.text({
          message: "Where should we create your project?",
          placeholder: "./demo-project",
          validate: (value) => {
            if (!value) return "Please enter a path.";
            if (value[0] !== ".") return "Please enter a relative path.";
          },
        }),
      type: ({ results }) =>
        p.select({
          message: `Pick a project type within "${results.path}"`,
          initialValue: "ts",
          options: [
            { value: "ts", label: "TypeScript" },
            { value: "js", label: "JavaScript" },
            { value: "coffee", label: "CoffeeScript", hint: "oh no" },
          ],
        }),
      tools: () =>
        p.multiselect({
          message: "Select additional tools.",
          initialValue: ["prettier", "eslint"],
          options: [
            { value: "prettier", label: "Prettier", hint: "recommended" },
            { value: "eslint", label: "ESLint", hint: "recommended" },
            { value: "stylelint", label: "Stylelint" },
            { value: "gh-action", label: "GitHub Action" },
          ],
        }),
      install: () =>
        p.confirm({
          message: "Install dependencies?",
          initialValue: true,
        }),
    },
    {
      onCancel: async () => {
        p.cancel("Operation cancelled.");
        console.log('Run `pnpm start` to restart the demo.')
        process.exit(0)
      },
    }
  );

  if (project.install) {
    const s = p.spinner();
    s.start("Installing via pnpm");
    await setTimeout(5000);
    s.stop("Installed via pnpm");
  }

  let nextSteps = `cd ${project.path}        \n${
    project.install ? "" : "pnpm install\n"
  }pnpm dev`;

  p.note(nextSteps, "Next steps.");

  p.outro(
    `Problems? ${color.underline(color.cyan("https://clack.cc/issues"))}`
  );

  await setTimeout(5000);

  return main();
}

main().catch(console.error);
