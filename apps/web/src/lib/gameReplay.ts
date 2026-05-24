import { Chess } from "chess.js";
import type { MoveRow } from "@/components/MoveList";

export type GameReplayData = {
  fens: string[];
  rows: MoveRow[];
  totalPlies: number;
  pgnError?: string;
};

export function buildGameReplayFromPgn(pgn: string | undefined | null): GameReplayData {
  const startFen = new Chess().fen();
  if (!pgn?.trim()) {
    return { fens: [startFen], rows: [], totalPlies: 0 };
  }

  try {
    const chess = new Chess();
    chess.loadPgn(pgn);
    const history = chess.history();
    chess.reset();
    const positionFens = [chess.fen()];
    for (const move of history) {
      chess.move(move);
      positionFens.push(chess.fen());
    }

    const moveRows: MoveRow[] = [];
    for (let i = 0; i < history.length; i += 2) {
      moveRows.push({
        moveNumber: Math.floor(i / 2) + 1,
        white: history[i],
        black: history[i + 1],
      });
    }

    return {
      fens: positionFens,
      rows: moveRows,
      totalPlies: history.length,
    };
  } catch {
    return {
      fens: [startFen],
      rows: [],
      totalPlies: 0,
      pgnError: "Could not read this game's move list.",
    };
  }
}

export function parseCachedEvals(
  cachedJson: string,
): Array<{ cp: number; mate?: number } | null> | null {
  try {
    const parsed: unknown = JSON.parse(cachedJson);
    if (!Array.isArray(parsed)) {
      return null;
    }
    return parsed as Array<{ cp: number; mate?: number } | null>;
  } catch {
    return null;
  }
}
