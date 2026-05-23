export type TimeControlCategory =
  | "bullet"
  | "blitz"
  | "rapid"
  | "classical"
  | "correspondence";

export type PlayType = "live" | "correspondence";

export type TimeControlPreset = {
  label: string;
  baseTimeMs: number;
  incrementMs: number;
};

/** Standard Lichess-style presets for quick pairing and vs-computer. */
export const TIME_CONTROL_PRESETS: TimeControlPreset[] = [
  { label: "1+0", baseTimeMs: 60_000, incrementMs: 0 },
  { label: "2+1", baseTimeMs: 120_000, incrementMs: 1_000 },
  { label: "3+0", baseTimeMs: 180_000, incrementMs: 0 },
  { label: "3+2", baseTimeMs: 180_000, incrementMs: 2_000 },
  { label: "5+0", baseTimeMs: 300_000, incrementMs: 0 },
  { label: "5+3", baseTimeMs: 300_000, incrementMs: 3_000 },
  { label: "10+0", baseTimeMs: 600_000, incrementMs: 0 },
  { label: "10+5", baseTimeMs: 600_000, incrementMs: 5_000 },
  { label: "15+10", baseTimeMs: 900_000, incrementMs: 10_000 },
  { label: "30+0", baseTimeMs: 1_800_000, incrementMs: 0 },
  { label: "30+20", baseTimeMs: 1_800_000, incrementMs: 20_000 },
];

const MS_PER_DAY = 86_400_000;

/** Classify live time controls (Lichess-style thresholds). */
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

export function formatTimeControlLabel(
  baseTimeMs: number | undefined,
  incrementMs: number | undefined,
): string {
  if (baseTimeMs === undefined) return "Untimed";
  const baseSec = Math.round(baseTimeMs / 1000);
  const incSec = Math.round((incrementMs ?? 0) / 1000);
  return incSec > 0 ? `${baseSec / 60 >= 1 ? `${Math.round(baseSec / 60)}` : baseSec}+${incSec}` : `${baseSec >= 60 ? Math.round(baseSec / 60) : baseSec}+0`;
}

export function computeTurnDeadline(
  lastMoveAt: number,
  daysPerTurn: number,
): number {
  return lastMoveAt + daysPerTurn * MS_PER_DAY;
}

export function formatPresetLabel(preset: TimeControlPreset): string {
  return preset.label;
}
