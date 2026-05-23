import { useCallback, useEffect, useState } from "react";

export function useGameReplay(totalPlies: number, intervalMs = 800) {
  const [plyIndex, setPlyIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  const goFirst = useCallback(() => setPlyIndex(0), []);
  const goPrev = useCallback(
    () => setPlyIndex((p) => Math.max(0, p - 1)),
    [],
  );
  const goNext = useCallback(
    () => setPlyIndex((p) => Math.min(totalPlies, p + 1)),
    [totalPlies],
  );
  const goLast = useCallback(() => setPlyIndex(totalPlies), [totalPlies]);
  const togglePlay = useCallback(() => setPlaying((p) => !p), []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goPrev, goNext]);

  useEffect(() => {
    if (!playing) return;
    if (plyIndex >= totalPlies) {
      setPlaying(false);
      return;
    }
    const id = window.setInterval(() => {
      setPlyIndex((p) => {
        if (p >= totalPlies) {
          setPlaying(false);
          return p;
        }
        return p + 1;
      });
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [playing, plyIndex, totalPlies, intervalMs]);

  return {
    plyIndex,
    setPlyIndex,
    playing,
    togglePlay,
    goFirst,
    goPrev,
    goNext,
    goLast,
  };
}
