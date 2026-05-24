import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

type CancelWaitingGameButtonProps = {
  gameId: Id<"games">;
  className?: string;
  label?: string;
  onCancelled?: () => void;
};

export function CancelWaitingGameButton({
  gameId,
  className,
  label = "Cancel",
  onCancelled,
}: CancelWaitingGameButtonProps) {
  const cancelWaitingGame = useMutation(api.games.cancelWaitingGame);

  return (
    <button
      type="button"
      className={className}
      onClick={() =>
        void cancelWaitingGame({ gameId })
          .then(() => onCancelled?.())
          .catch(() => {
            // Query refresh will reflect state; ignore stale clicks.
          })
      }
    >
      {label}
    </button>
  );
}
