import { useEffect, useRef } from "react";
import { playKnockSound } from "@/lib/playKnockSound";

/** Plays a knock when the game transitions to abandoned. */
export function useGameAbortedAlert(status: string | undefined): void {
  const previousStatus = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (
      status === "abandoned" &&
      previousStatus.current !== undefined &&
      previousStatus.current !== "abandoned"
    ) {
      playKnockSound();
    }
    previousStatus.current = status;
  }, [status]);
}
