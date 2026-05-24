import { useEffect, useState } from "react";

export function useDisconnectCountdown(deadlineAt: number | undefined): number | null {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(() =>
    deadlineAt ? Math.max(0, Math.ceil((deadlineAt - Date.now()) / 1000)) : null,
  );

  useEffect(() => {
    if (deadlineAt === undefined) {
      setSecondsLeft(null);
      return;
    }

    const tick = () => {
      setSecondsLeft(Math.max(0, Math.ceil((deadlineAt - Date.now()) / 1000)));
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [deadlineAt]);

  return secondsLeft;
}
