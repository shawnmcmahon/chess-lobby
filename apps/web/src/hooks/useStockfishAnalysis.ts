import { useCallback, useEffect, useRef, useState } from "react";

export type MoveEval = {
  cp: number;
  mate?: number;
};

function parseEvalLine(line: string): MoveEval | null {
  const match = line.match(/score cp (-?\d+)/);
  if (match) {
    return { cp: Number.parseInt(match[1], 10) };
  }
  const mateMatch = line.match(/score mate (-?\d+)/);
  if (mateMatch) {
    const mate = Number.parseInt(mateMatch[1], 10);
    return { cp: mate > 0 ? 10000 : -10000, mate };
  }
  return null;
}

function analyzePosition(worker: Worker, fen: string, depth = 12): Promise<MoveEval> {
  return new Promise((resolve) => {
    let resolved = false;

    function onMessage(event: MessageEvent<string>) {
      const line = event.data;
      if (typeof line !== "string") return;
      if (line.startsWith("bestmove")) {
        if (!resolved) {
          resolved = true;
          worker.removeEventListener("message", onMessage);
          resolve({ cp: 0 });
        }
        return;
      }
      if (line.includes("score")) {
        const parsed = parseEvalLine(line);
        if (parsed) {
          resolved = true;
          worker.removeEventListener("message", onMessage);
          resolve(parsed);
        }
      }
    }

    worker.addEventListener("message", onMessage);
    worker.postMessage("stop");
    worker.postMessage("position fen " + fen);
    worker.postMessage(`go depth ${depth}`);

    window.setTimeout(() => {
      if (!resolved) {
        resolved = true;
        worker.removeEventListener("message", onMessage);
        resolve({ cp: 0 });
      }
    }, 8000);
  });
}

export function useStockfishAnalysis(
  fens: string[],
  cachedJson?: string | null,
) {
  const [evals, setEvals] = useState<(MoveEval | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (cachedJson) {
      try {
        setEvals(JSON.parse(cachedJson) as MoveEval[]);
      } catch {
        setEvals([]);
      }
      return;
    }

    if (fens.length === 0) {
      setEvals([]);
      return;
    }

    let cancelled = false;

    async function run() {
      setLoading(true);
      setProgress(0);
      const wasmSupported =
        typeof WebAssembly === "object" &&
        typeof WebAssembly.validate === "function";

      const workerUrl = wasmSupported
        ? "/stockfish/stockfish.wasm.js"
        : "/stockfish/stockfish.js";

      const worker = new Worker(workerUrl, { type: "classic" });
      workerRef.current = worker;
      worker.postMessage("uci");

      const results: (MoveEval | null)[] = [];
      for (let i = 0; i < fens.length; i++) {
        if (cancelled) break;
        const evalResult = await analyzePosition(worker, fens[i]);
        results.push(evalResult);
        setEvals([...results]);
        setProgress(Math.round(((i + 1) / fens.length) * 100));
      }

      worker.terminate();
      workerRef.current = null;
      if (!cancelled) {
        setLoading(false);
      }
    }

    void run();

    return () => {
      cancelled = true;
      workerRef.current?.terminate();
    };
  }, [fens.join("|"), cachedJson]);

  const serialize = useCallback(() => JSON.stringify(evals), [evals]);

  return { evals, loading, progress, serialize };
}
