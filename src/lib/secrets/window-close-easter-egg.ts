export type WindowCloseEasterEgg = "creeper" | "enderman";

const EASTER_EGG_CHANCE = 0.12;

/** Случайная пасхалка при закрытии окна (≈12% шанс). */
export function rollWindowCloseEasterEgg(): WindowCloseEasterEgg | null {
  if (Math.random() > EASTER_EGG_CHANCE) return null;
  const r = Math.random();
  if (r < 0.5) return "creeper";
  return "enderman";
}
