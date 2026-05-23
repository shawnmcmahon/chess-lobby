import type { TimeControlPreset } from "@/lib/timeControl";
import { TIME_CONTROL_PRESETS } from "@/lib/timeControl";

type QuickPairGridProps = {
  onSelect: (preset: TimeControlPreset) => void;
  disabled?: boolean;
};

export function QuickPairGrid({ onSelect, disabled }: QuickPairGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
      {TIME_CONTROL_PRESETS.map((preset) => (
        <button
          key={preset.label}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(preset)}
          className="rounded-lg border border-stone-700 bg-stone-900/60 py-3 text-sm font-medium hover:border-amber-600 hover:bg-amber-950/30 disabled:opacity-50"
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
