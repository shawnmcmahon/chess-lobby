import { Chess, type Move } from "chess.js";

const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 0,
};

function evaluate(chess: Chess): number {
  if (chess.isCheckmate()) {
    return chess.turn() === "w" ? 100_000 : -100_000;
  }
  if (chess.isDraw()) {
    return 0;
  }

  let score = 0;
  for (const row of chess.board()) {
    for (const piece of row) {
      if (!piece) continue;
      const value = PIECE_VALUES[piece.type] ?? 0;
      score += piece.color === "b" ? value : -value;
    }
  }
  return score;
}

function search(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
): number {
  if (depth === 0 || chess.isGameOver()) {
    return evaluate(chess);
  }

  const moves = chess.moves();
  if (maximizing) {
    let best = -Infinity;
    for (const move of moves) {
      chess.move(move);
      best = Math.max(best, search(chess, depth - 1, alpha, beta, false));
      chess.undo();
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  }

  let best = Infinity;
  for (const move of moves) {
    chess.move(move);
    best = Math.min(best, search(chess, depth - 1, alpha, beta, true));
    chess.undo();
    beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  return best;
}

function moveToUci(move: Move): string {
  return move.from + move.to + (move.promotion ?? "");
}

function skillToDepth(skill: number): number {
  return Math.max(1, Math.min(4, Math.floor(skill / 5) + 1));
}

export function getComputerMove(fen: string, skill = 10): string {
  const chess = new Chess(fen);
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) {
    throw new Error("No legal moves");
  }

  const depth = skillToDepth(skill);
  const scored = moves
    .map((move) => {
      chess.move(move);
      const score = search(chess, depth - 1, -Infinity, Infinity, false);
      chess.undo();
      return { move, score };
    })
    .sort((a, b) => b.score - a.score);

  const slip = Math.min(scored.length - 1, Math.floor((20 - skill) / 3));
  const pool = scored.slice(0, slip + 1);
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  return moveToUci(chosen.move);
}

function isLocalEngineUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "::1"
    );
  } catch {
    return true;
  }
}

export async function getBestMove(
  fen: string,
  skill: number,
  _movetimeMs: number,
): Promise<string> {
  const engineUrl = process.env.ENGINE_API_URL;
  const engineKey = process.env.ENGINE_API_KEY;

  if (engineUrl && !isLocalEngineUrl(engineUrl)) {
    try {
      const response = await fetch(`${engineUrl}/api/best-move`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(engineKey ? { "X-Api-Key": engineKey } : {}),
        },
        body: JSON.stringify({ fen, skill, movetimeMs: _movetimeMs }),
      });

      if (response.ok) {
        const data = (await response.json()) as { bestMove?: string };
        if (data.bestMove) {
          return data.bestMove;
        }
      } else {
        console.error("External engine failed", await response.text());
      }
    } catch (err) {
      console.error("External engine unreachable", err);
    }
  }

  return getComputerMove(fen, skill);
}
