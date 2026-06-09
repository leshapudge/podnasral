export type WindowCloseEasterEgg = "herobrine" | "creeper" | "enderman";

const EASTER_EGG_CHANCE = 0.12;

/** Случайная пасхалка при закрытии окна (≈12% шанс). */
export function rollWindowCloseEasterEgg(): WindowCloseEasterEgg | null {
  if (Math.random() > EASTER_EGG_CHANCE) return null;
  const r = Math.random();
  if (r < 0.34) return "herobrine";
  if (r < 0.67) return "creeper";
  return "enderman";
}
