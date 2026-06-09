import { SECRET_COMMANDS, WORLD_SEED } from "./definitions";

export interface CommandResult {
  message: string;
  action?: "herobrine" | "navigate" | "toast";
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
    case "/herobrine":
      return { message: "You are not alone...", action: "herobrine" };
    case "/notch":
      return { message: "§aNotch§r: Thanks for playing! — removed Herobrine in Beta 1.6.6" };
    case "/chunk":
      return {
        message: "Coordinates corrupted... try /lost-chunk",
        action: "navigate",
        href: "/lost-chunk",
      };
    case "/debug":
      return { message: "Secret debug mode enabled.", action: "toast" };
    default:
      return { message: `Unknown command: ${cmd}. Try /help` };
  }
}
