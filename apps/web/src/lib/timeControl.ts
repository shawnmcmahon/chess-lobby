export type TimeControlPreset = {
  label: string;
  baseTimeMs: number;
  incrementMs: number;
};

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

export const CORRESPONDENCE_DAY_OPTIONS = [
  0, 1, 2, 3, 5, 7, 10, 14,
] as const;
