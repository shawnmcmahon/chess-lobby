export type TimeControlCategory =
  | "bullet"
  | "blitz"
  | "rapid"
  | "classical"
  | "correspondence";

export type PlayType = "live" | "correspondence";

const MS_PER_DAY = 86_400_000;

export function categorizeTimeControl(
  baseTimeMs: number,
  incrementMs: number,
): Exclude<TimeControlCategory, "correspondence"> {
  const estimatedMinutes = (baseTimeMs + 40 * incrementMs) / 60_000;
  if (estimatedMinutes < 3) return "bullet";
  if (estimatedMinutes < 8) return "blitz";
  if (estimatedMinutes < 25) return "rapid";
  return "classical";
}

export function computeTurnDeadline(
  lastMoveAt: number,
  daysPerTurn: number,
): number {
  return lastMoveAt + daysPerTurn * MS_PER_DAY;
}
