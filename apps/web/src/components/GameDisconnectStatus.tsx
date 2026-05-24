import type { Doc } from "../../../../convex/_generated/dataModel";
import { useDisconnectCountdown } from "@/hooks/useDisconnectCountdown";

type GameDisconnectStatusProps = {
  game: Doc<"games">;
  myColor: "white" | "black" | null;
  className?: string;
};

function deadlineForColor(
  game: Doc<"games">,
  color: "white" | "black",
): number | undefined {
  return color === "white"
    ? game.whiteDisconnectDeadlineAt
    : game.blackDisconnectDeadlineAt;
}

export function GameDisconnectStatus({
  game,
  myColor,
  className = "",
}: GameDisconnectStatusProps) {
  const opponentColor = myColor === "white" ? "black" : myColor === "black" ? "white" : null;
  const myDeadline =
    myColor && game.playType !== "correspondence"
      ? deadlineForColor(game, myColor)
      : undefined;
  const opponentDeadline =
    opponentColor && game.playType !== "correspondence"
      ? deadlineForColor(game, opponentColor)
      : undefined;

  const reconnectSeconds = useDisconnectCountdown(myDeadline);
  const opponentSeconds = useDisconnectCountdown(opponentDeadline);

  if (game.playType === "correspondence" || !myColor) {
    return null;
  }

  if (myDeadline !== undefined && reconnectSeconds !== null) {
    return (
      <p className={className}>
        You disconnected — reconnect within {reconnectSeconds}s or you forfeit.
      </p>
    );
  }

  if (opponentDeadline !== undefined && opponentSeconds !== null) {
    return (
      <p className={className}>
        Opponent disconnected — {opponentSeconds}s to reconnect.
      </p>
    );
  }

  return null;
}
