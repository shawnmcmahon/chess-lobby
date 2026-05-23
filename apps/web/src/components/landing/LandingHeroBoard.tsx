import { Chess } from "chess.js";
import { useEffect, useMemo, useState } from "react";
import { ChessBoardView } from "@/components/ChessBoardView";

const SHOWCASE_MOVES = [
  ["e4", "e5"],
  ["Nf3", "Nc6"],
  ["Bc4", "Nf6"],
  ["Ng5", "d5"],
  ["exd5", "Nxd5"],
  ["Nxf7"],
] as const;

type LandingHeroBoardProps = {
  className?: string;
  intervalMs?: number;
  readOnly?: boolean;
};

export function LandingHeroBoard({
  className = "",
  intervalMs = 2200,
  readOnly = true,
}: LandingHeroBoardProps) {
  const [step, setStep] = useState(0);

  const fen = useMemo(() => {
    const chess = new Chess();
    for (let i = 0; i < step; i++) {
      const pair = SHOWCASE_MOVES[i];
      if (!pair) break;
      for (const san of pair) {
        try {
          chess.move(san);
        } catch {
          break;
        }
      }
    }
    return chess.fen();
  }, [step]);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const id = window.setInterval(() => {
      setStep((s) => (s + 1 > SHOWCASE_MOVES.length ? 0 : s + 1));
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return (
    <div className={className}>
      <ChessBoardView fen={fen} readOnly={readOnly} allowDrawingArrows={false} />
    </div>
  );
}
