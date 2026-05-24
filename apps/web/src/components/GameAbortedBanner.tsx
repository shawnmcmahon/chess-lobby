import { Link } from "react-router-dom";
import type { TurnIndicatorTheme } from "@/components/TurnIndicator";

export type GameAbortedBannerTheme = TurnIndicatorTheme;

type GameAbortedBannerProps = {
  theme: GameAbortedBannerTheme;
  status: string;
  endReason?: string;
};

const bannerClasses: Record<
  GameAbortedBannerTheme,
  { root: string; title: string; detail: string; button: string }
> = {
  default: {
    root: "default-panel default-panel--accent border-2 border-[var(--default-danger)] px-6 py-8 text-center",
    title: "default-display text-3xl text-[var(--default-danger)]",
    detail: "default-mono mt-2 text-sm text-[var(--default-mist)]",
    button: "default-btn default-btn--primary mt-6 inline-block",
  },
  bento: {
    root: "bento-tile col-span-12 rounded-2xl px-6 py-8 text-center",
    title: "bento-tile__title text-[2rem]",
    detail: "bento-mono mt-2 text-sm opacity-80",
    button: "bento-btn mt-6 inline-block",
  },
  atelier: {
    root: "atelier-panel atelier-panel--parchment px-6 py-8 text-center",
    title: "atelier-display text-[2.2rem] italic text-[var(--atelier-oxblood)]",
    detail: "atelier-smallcaps mt-2 text-[var(--atelier-brass)]",
    button: "atelier-btn mt-6 inline-block",
  },
  brutal: {
    root: "brutal-card brutal-card--magenta px-6 py-8 text-center",
    title: "brutal-display text-[2rem]",
    detail: "brutal-chunk mt-2 text-[0.95rem]",
    button: "brutal-btn brutal-btn--ink mt-6 inline-block",
  },
};

function formatAbortDetail(endReason?: string): string | null {
  if (!endReason) return null;
  if (endReason === "first_move_timeout") {
    return "First-move time expired.";
  }
  if (endReason === "cancelled") {
    return "The game was cancelled.";
  }
  return endReason.replace(/_/g, " ");
}

export function GameAbortedBanner({
  theme,
  status,
  endReason,
}: GameAbortedBannerProps) {
  if (status !== "abandoned") {
    return null;
  }

  const styles = bannerClasses[theme];
  const detail = formatAbortDetail(endReason);

  return (
    <div
      className={styles.root}
      style={
        theme === "bento"
          ? { background: "var(--bento-clay, #e85d4c)", color: "#fff9f3" }
          : undefined
      }
      role="alert"
    >
      <p className={styles.title}>Game Aborted</p>
      {detail && <p className={styles.detail}>{detail}</p>}
      <Link to="/dashboard" className={styles.button}>
        {theme === "brutal" ? "← BACK TO LOBBY" : "Back to dashboard"}
      </Link>
    </div>
  );
}
