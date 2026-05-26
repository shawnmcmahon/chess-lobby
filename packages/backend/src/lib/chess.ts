import { Chess } from "chess.js";

export type MoveResult = {
  fen: string;
  pgn: string;
  currentTurn: "white" | "black";
  isGameOver: boolean;
  winner?: "white" | "black";
  endReason?: string;
};

export function applyMove(
  fen: string,
  from: string,
  to: string,
  promotion?: string,
): MoveResult {
  const chess = new Chess(fen);
  const move = chess.move({ from, to, promotion: promotion ?? "q" });
  if (!move) {
    throw new Error("Illegal move");
  }

  let winner: "white" | "black" | undefined;
  let endReason: string | undefined;

  if (chess.isGameOver()) {
    if (chess.isCheckmate()) {
      winner = chess.turn() === "w" ? "black" : "white";
      endReason = "checkmate";
    } else if (chess.isStalemate()) {
      endReason = "stalemate";
    } else if (chess.isDraw()) {
      endReason = "draw";
    } else {
      endReason = "game_over";
    }
  }

  return {
    fen: chess.fen(),
    pgn: chess.pgn(),
    currentTurn: chess.turn() === "w" ? "white" : "black",
    isGameOver: chess.isGameOver(),
    winner,
    endReason,
  };
}

export const STARTING_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
