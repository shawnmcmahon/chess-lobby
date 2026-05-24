import { useEffect, useState } from "react";
import { getLiveClockDisplay } from "@/lib/liveClock";
import { getTurnIndicatorCopy } from "@/lib/turnIndicator";

type GameClockProps = {
  whiteTimeMs?: number;
  blackTimeMs?: number;
  currentTurn: "white" | "black";
  lastMoveAt?: number;
  status: string;
  playType?: "live" | "correspondence";
  turnDeadlineAt?: number;
  daysPerTurn?: number;
  mainClockStarted?: boolean;
  firstMoveDeadlineAt?: number;
  baseTimeMs?: number;
  myColor?: "white" | "black" | null;
  spectate?: boolean;
  whiteName?: string;
  blackName?: string;
};

function formatMs(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatDaysLeft(deadlineAt: number, now: number): string {
  const msLeft = Math.max(0, deadlineAt - now);
  const days = Math.ceil(msLeft / 86_400_000);
  if (days <= 0) return "Time expired";
  return days === 1 ? "1 day left" : `${days} days left`;
}

function ClockRow({
  label,
  timeMs,
  active,
  lowTime,
}: {
  label: string;
  timeMs: string;
  active: boolean;
  lowTime: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded px-3 py-2 font-mono text-lg ${
        active ? "bg-amber-950/40 ring-1 ring-amber-700/50" : "bg-stone-900/60"
      } ${lowTime ? "animate-pulse text-red-400" : "text-stone-100"}`}
    >
      <span className="text-sm text-stone-400">{label}</span>
      <span>{timeMs}</span>
    </div>
  );
}

export function GameClock({
  whiteTimeMs,
  blackTimeMs,
  currentTurn,
  lastMoveAt,
  status,
  playType = "live",
  turnDeadlineAt,
  daysPerTurn,
  mainClockStarted,
  firstMoveDeadlineAt,
  baseTimeMs,
  myColor = null,
  spectate = false,
  whiteName = "White",
  blackName = "Black",
}: GameClockProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (status !== "active") return;
    const id = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(id);
  }, [status]);

  if (playType === "correspondence") {
    if (!daysPerTurn || !turnDeadlineAt) {
      return (
        <p className="text-center text-sm text-stone-500">No turn timer</p>
      );
    }
    return (
      <p className="text-center text-sm text-amber-300/90">
        {currentTurn === "white" ? "White" : "Black"} to move ·{" "}
        {formatDaysLeft(turnDeadlineAt, now)}
      </p>
    );
  }

  if (whiteTimeMs === undefined || blackTimeMs === undefined) {
    return null;
  }

  const { displayWhite, displayBlack, inFirstMovePhase, lowWhite, lowBlack } =
    getLiveClockDisplay(
      {
        status,
        playType,
        baseTimeMs,
        mainClockStarted,
        firstMoveDeadlineAt,
        whiteTimeMs,
        blackTimeMs,
        currentTurn,
        lastMoveAt,
      },
      now,
    );

  const turnCopy =
    status === "active"
      ? getTurnIndicatorCopy({
          currentTurn,
          myColor,
          spectate,
          whiteName,
          blackName,
          status,
        })
      : null;

  return (
    <div className="mx-auto max-w-[480px] space-y-2">
      {turnCopy && (
        <p
          className={`text-center text-base font-semibold ${
            turnCopy.isMyTurn ? "text-amber-300" : "text-stone-200"
          }`}
          role="status"
        >
          {turnCopy.primary}
        </p>
      )}
      {inFirstMovePhase && (
        <p className="text-center text-xs text-amber-300/80">
          First move · 30s to play or the game is aborted
        </p>
      )}
      <ClockRow
        label="Black"
        timeMs={formatMs(displayBlack)}
        active={currentTurn === "black" && status === "active"}
        lowTime={lowBlack}
      />
      <ClockRow
        label="White"
        timeMs={formatMs(displayWhite)}
        active={currentTurn === "white" && status === "active"}
        lowTime={lowWhite}
      />
    </div>
  );
}
