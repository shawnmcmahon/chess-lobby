import { getTurnIndicatorCopy } from "@/lib/turnIndicator";

export type TurnIndicatorTheme = "default" | "bento" | "atelier" | "brutal";

type TurnIndicatorProps = {
  theme: TurnIndicatorTheme;
  currentTurn: "white" | "black";
  myColor: "white" | "black" | null;
  spectate: boolean;
  whiteName: string;
  blackName: string;
  status: string;
  className?: string;
};

const themeClasses: Record<
  TurnIndicatorTheme,
  { root: string; rootActive: string; primary: string; secondary: string }
> = {
  default: {
    root: "default-panel border border-[var(--default-border)] px-4 py-3 text-center",
    rootActive:
      "default-panel default-panel--accent border border-[var(--default-ember)] px-4 py-3 text-center ring-1 ring-[var(--default-ember)]/40",
    primary: "default-display text-xl text-[var(--default-ember)]",
    secondary: "default-mono mt-1 text-sm text-[var(--default-mist)]",
  },
  bento: {
    root: "rounded-2xl px-4 py-3 text-center",
    rootActive: "rounded-2xl px-4 py-3 text-center",
    primary: "bento-tile__title text-[1.45rem]",
    secondary: "bento-mono mt-1 text-[0.72rem] uppercase tracking-widest opacity-75",
  },
  atelier: {
    root: "atelier-panel px-4 py-3 text-center",
    rootActive: "atelier-panel atelier-panel--parchment px-4 py-3 text-center",
    primary: "atelier-display text-[1.6rem] italic",
    secondary: "atelier-smallcaps mt-1 text-[var(--atelier-brass)]",
  },
  brutal: {
    root: "brutal-card brutal-card--paper px-4 py-3 text-center",
    rootActive: "brutal-card brutal-card--yellow px-4 py-3 text-center",
    primary: "brutal-display text-[1.35rem]",
    secondary: "brutal-chunk mt-1 text-[0.85rem]",
  },
};

export function TurnIndicator({
  theme,
  currentTurn,
  myColor,
  spectate,
  whiteName,
  blackName,
  status,
  className = "",
}: TurnIndicatorProps) {
  const copy = getTurnIndicatorCopy({
    currentTurn,
    myColor,
    spectate,
    whiteName,
    blackName,
    status,
  });

  if (!copy) {
    return null;
  }

  const styles = themeClasses[theme];
  const rootClass = copy.isMyTurn ? styles.rootActive : styles.root;

  const bentoStyle =
    theme === "bento"
      ? {
          background: copy.isMyTurn ? "var(--bento-jade)" : "var(--bento-paper)",
          color: copy.isMyTurn ? "#fff" : "var(--bento-ink)",
        }
      : undefined;

  return (
    <div
      className={`${rootClass} ${className}`.trim()}
      style={bentoStyle}
      role="status"
      aria-live="polite"
    >
      <p className={styles.primary}>{copy.primary}</p>
      <p className={styles.secondary}>{copy.secondary}</p>
    </div>
  );
}
