import type { Id } from "../../../../convex/_generated/dataModel";
import { TIME_CONTROL_PRESETS } from "@/lib/timeControl";

export type LookingForOpponentEntry = {
  game: {
    _id: Id<"games">;
    baseTimeMs?: number;
    incrementMs?: number;
    timeControlCategory?: string;
  };
  host: {
    _id: Id<"users">;
    displayName?: string;
    name?: string;
    rating?: number;
  } | null;
  isOwnGame: boolean;
};

export type LookingForOpponentTheme = "default" | "bento" | "atelier" | "brutal";

type LookingForOpponentSectionProps = {
  entries: LookingForOpponentEntry[] | undefined;
  loading?: boolean;
  theme: LookingForOpponentTheme;
  onJoin: (gameId: Id<"games">) => void;
  onCancel: (gameId: Id<"games">) => void;
};

function timeControlLabel(baseTimeMs?: number, incrementMs?: number): string {
  const preset = TIME_CONTROL_PRESETS.find(
    (p) => p.baseTimeMs === baseTimeMs && p.incrementMs === incrementMs,
  );
  if (preset) return preset.label;
  if (baseTimeMs === undefined) return "Untimed";
  const baseMin = Math.round(baseTimeMs / 60_000);
  const incSec = Math.round((incrementMs ?? 0) / 1000);
  return incSec > 0 ? `${baseMin}+${incSec}` : `${baseMin}+0`;
}

function hostName(entry: LookingForOpponentEntry): string {
  return entry.host?.displayName ?? entry.host?.name ?? "Player";
}

export function LookingForOpponentSection({
  entries,
  loading,
  theme,
  onJoin,
  onCancel,
}: LookingForOpponentSectionProps) {
  if (!entries || entries.length === 0) {
    return null;
  }

  const styles = themeStyles[theme];

  return (
    <section
      className={styles.section}
      style={
        theme === "bento"
          ? { padding: 24, animationDelay: "280ms" }
          : theme === "brutal"
            ? { padding: 22 }
            : undefined
      }
    >
      {theme === "bento" && (
        <div className="bento-tile__eyebrow">Open seats</div>
      )}
      {theme === "atelier" && <Corners />}
      {theme === "brutal" && (
        <span className="brutal-sticker" style={{ top: -16, left: 24 }} data-tilt="left">
          OPEN
        </span>
      )}
      <h2 className={styles.title}>Looking for Opponent</h2>
      <ul className={styles.list}>
        {entries.map((entry) => {
          const label = timeControlLabel(
            entry.game.baseTimeMs,
            entry.game.incrementMs,
          );
          const rating = entry.host?.rating ?? 1200;

          return (
            <li
              key={entry.game._id}
              className={styles.item}
              style={
                theme === "bento"
                  ? { background: "rgba(14,14,16,0.04)" }
                  : theme === "atelier"
                    ? { borderBottom: "1px solid rgba(11,20,36,0.12)" }
                    : theme === "brutal"
                      ? { padding: 12, boxShadow: "4px 4px 0 var(--brutal-ink)" }
                      : undefined
              }
            >
              <div className={styles.itemMain}>
                <span className={styles.hostName}>{hostName(entry)}</span>
                <span className={styles.meta}>
                  {label} · {rating}
                  {entry.game.timeControlCategory
                    ? ` · ${entry.game.timeControlCategory}`
                    : ""}
                </span>
                {entry.isOwnGame && (
                  <div className={styles.waitingRow}>
                    <span className={styles.spinner} aria-hidden />
                    <span className={styles.waitingText}>
                      Waiting for Opponent to Join
                    </span>
                  </div>
                )}
              </div>
              <div className={styles.actions}>
                {entry.isOwnGame ? (
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    disabled={loading}
                    onClick={() => void onCancel(entry.game._id)}
                  >
                    {styles.cancelLabel}
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.joinBtn}
                    disabled={loading}
                    onClick={() => void onJoin(entry.game._id)}
                  >
                    {styles.joinLabel}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Corners() {
  return (
    <>
      <span
        className="absolute top-2 left-2 w-3 h-3 border-t border-l"
        style={{ borderColor: "var(--atelier-brass-dim)" }}
        aria-hidden
      />
      <span
        className="absolute top-2 right-2 w-3 h-3 border-t border-r"
        style={{ borderColor: "var(--atelier-brass-dim)" }}
        aria-hidden
      />
      <span
        className="absolute bottom-2 left-2 w-3 h-3 border-b border-l"
        style={{ borderColor: "var(--atelier-brass-dim)" }}
        aria-hidden
      />
      <span
        className="absolute bottom-2 right-2 w-3 h-3 border-b border-r"
        style={{ borderColor: "var(--atelier-brass-dim)" }}
        aria-hidden
      />
    </>
  );
}

const themeStyles = {
  default: {
    section: "default-panel default-panel--accent p-4",
    title: "default-display text-lg text-[var(--default-ember)]",
    list: "mt-3 space-y-2",
    item: "default-list-item flex flex-wrap items-center justify-between gap-2",
    itemMain: "min-w-0 flex-1 space-y-1",
    hostName: "font-medium",
    meta: "default-mono text-xs text-[var(--default-mist)]",
    waitingRow:
      "default-mono flex items-center gap-2 text-sm text-[var(--default-ember)]",
    spinner:
      "inline-block h-2 w-2 animate-spin rounded-full border border-[var(--default-ember)] border-t-transparent",
    waitingText: "",
    actions: "flex shrink-0 gap-2",
    joinBtn: "default-btn default-btn--primary text-sm",
    cancelBtn: "default-btn default-btn--ghost text-sm",
    joinLabel: "Join",
    cancelLabel: "Cancel",
  },
  bento: {
    section: "bento-tile col-span-12",
    title: "bento-tile__title",
    list: "mt-4 space-y-2",
    item: "flex flex-wrap items-center justify-between gap-3 rounded-xl px-3 py-2",
    itemMain: "min-w-0 flex-1 space-y-1",
    hostName: "bento-mono text-sm font-medium",
    meta: "bento-mono text-[0.68rem] opacity-70",
    waitingRow: "bento-mono flex items-center gap-2 text-[0.72rem]",
    spinner:
      "inline-block h-2 w-2 animate-spin rounded-full border border-[var(--bento-jade)] border-t-transparent",
    waitingText: "text-[var(--bento-jade)]",
    actions: "flex shrink-0 gap-2",
    joinBtn: "bento-btn",
    cancelBtn: "bento-btn bento-btn--ghost",
    joinLabel: "Join",
    cancelLabel: "Cancel",
  },
  atelier: {
    section: "atelier-panel atelier-panel--parchment relative",
    title: "atelier-display text-[1.8rem] italic mt-1",
    list: "mt-4 space-y-2",
    item: "flex flex-wrap items-center justify-between gap-3 py-2",
    itemMain: "min-w-0 flex-1 space-y-1",
    hostName: "atelier-display text-[1.2rem]",
    meta: "atelier-smallcaps text-[var(--atelier-brass)]",
    waitingRow:
      "atelier-smallcaps flex items-center gap-2 text-[var(--atelier-brass)]",
    spinner:
      "inline-block h-2 w-2 animate-spin rounded-full border border-[var(--atelier-brass)] border-t-transparent",
    waitingText: "",
    actions: "flex shrink-0 gap-2",
    joinBtn: "atelier-btn",
    cancelBtn: "atelier-btn atelier-btn--oxblood",
    joinLabel: "Join",
    cancelLabel: "Cancel",
  },
  brutal: {
    section: "brutal-card brutal-card--yellow relative",
    title: "brutal-display text-[1.4rem]",
    list: "mt-4 space-y-2",
    item: "brutal-card brutal-card--paper flex flex-wrap items-center justify-between gap-2",
    itemMain: "min-w-0 flex-1 space-y-1",
    hostName: "brutal-display text-[0.95rem]",
    meta: "brutal-chunk text-[0.8rem]",
    waitingRow: "brutal-display flex items-center gap-2 text-[0.85rem]",
    spinner:
      "inline-block h-2 w-2 animate-spin rounded-full border-2 border-[var(--brutal-ink)] border-t-transparent",
    waitingText: "text-[var(--brutal-magenta)]",
    actions: "flex shrink-0 gap-2",
    joinBtn: "brutal-btn brutal-btn--ink",
    cancelBtn: "brutal-btn",
    joinLabel: "▶ JOIN",
    cancelLabel: "✗ CANCEL",
  },
} as const;
