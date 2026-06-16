import { SECRET_COMMANDS, WORLD_SEED } from "./definitions";

export interface CommandResult {
  message: string;
  action?: "navigate" | "toast";
  href?: string;
}

export function executeSecretCommand(input: string): CommandResult | null {
  const cmd = input.trim().toLowerCase();
  if (!cmd.startsWith("/")) return null;

  switch (cmd) {
    case "/help":
      return {
        message: SECRET_COMMANDS.filter((c) => !c.hidden)
          .map((c) => `${c.command} — ${c.description}`)
          .join("\n"),
      };
    case "/seed":
      return { message: `World seed: ${WORLD_SEED}` };
    case "/notch":
      return { message: "§aNotch§r: Thanks for playing!" };
    case "/chunk":
      return {
        message: "Данные чанка восстановлены. Открой вкладку «Достижения» в OS.",
        action: "navigate",
        href: "/?tab=achievements",
      };
    case "/debug":
      return { message: "Secret debug mode enabled.", action: "toast" };
    default:
      return { message: `Unknown command: ${cmd}. Try /help` };
  }
}
