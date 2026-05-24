import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export type CancelWaitingGameTheme = "default" | "bento" | "atelier" | "brutal";

type CancelWaitingGameButtonProps = {
  gameId: Id<"games">;
  className?: string;
  label?: string;
  variant?: "text" | "icon";
  theme?: CancelWaitingGameTheme;
  onCancelled?: () => void;
};

const iconClassNames: Record<CancelWaitingGameTheme, string> = {
  default:
    "default-btn default-btn--ghost flex h-8 w-8 shrink-0 items-center justify-center p-0 text-base leading-none",
  bento:
    "bento-btn bento-btn--ghost flex h-8 w-8 shrink-0 items-center justify-center p-0 text-base leading-none",
  atelier:
    "atelier-btn atelier-btn--oxblood flex h-8 w-8 shrink-0 items-center justify-center p-0 text-base leading-none",
  brutal:
    "brutal-btn flex h-10 w-10 shrink-0 items-center justify-center p-0 text-lg leading-none",
};

export function CancelWaitingGameButton({
  gameId,
  className,
  label = "Cancel",
  variant = "text",
  theme = "default",
  onCancelled,
}: CancelWaitingGameButtonProps) {
  const cancelWaitingGame = useMutation(api.games.cancelWaitingGame);
  const isIcon = variant === "icon";
  const resolvedClassName =
    className ?? (isIcon ? iconClassNames[theme] : undefined);

  return (
    <button
      type="button"
      className={resolvedClassName}
      aria-label={isIcon ? "Cancel invite" : undefined}
      title={isIcon ? "Cancel invite" : undefined}
      onClick={() =>
        void cancelWaitingGame({ gameId })
          .then(() => onCancelled?.())
          .catch(() => {
            // Query refresh will reflect state; ignore stale clicks.
          })
      }
    >
      {isIcon ? "×" : label}
    </button>
  );
}
