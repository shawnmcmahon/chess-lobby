import type { FormEvent } from "react";

export type AtelierJoinGameStatus =
  | "invalid"
  | "loading"
  | "not_found"
  | "not_waiting"
  | "ready";

export type AtelierJoinGameProps = {
  status: AtelierJoinGameStatus;
  isAuthenticated: boolean;
  guestName: string;
  onGuestNameChange: (value: string) => void;
  joinAsLabel: string;
  error: string | null;
  onJoin: (e?: FormEvent) => void;
  onViewGame: () => void;
};

export function AtelierJoinGame({
  status,
  isAuthenticated,
  guestName,
  onGuestNameChange,
  joinAsLabel,
  error,
  onJoin,
  onViewGame,
}: AtelierJoinGameProps) {
  if (status === "invalid") {
    return (
      <p className="atelier-smallcaps text-center mt-12" style={{ color: "var(--atelier-oxblood)" }}>
        Invalid invitation — the seal is broken.
      </p>
    );
  }

  if (status === "loading") {
    return (
      <p className="atelier-smallcaps text-center mt-12" style={{ color: "var(--atelier-brass)" }}>
        Opening the invitation…
      </p>
    );
  }

  if (status === "not_found") {
    return (
      <p className="atelier-smallcaps text-center mt-12" style={{ color: "var(--atelier-oxblood)" }}>
        Game not found — perhaps the wax has melted.
      </p>
    );
  }

  if (status === "not_waiting") {
    return (
      <div className="mx-auto max-w-md text-center space-y-6">
        <div className="atelier-panel relative">
          <Corners />
          <div className="atelier-smallcaps" style={{ color: "var(--atelier-brass)" }}>
            Invitation expired
          </div>
          <p
            className="atelier-display mt-3"
            style={{ fontSize: "1.6rem", fontStyle: "italic" }}
          >
            This match no longer awaits a guest.
          </p>
          <button type="button" onClick={onViewGame} className="atelier-btn mt-6">
            View the board
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md relative">
      <div className="atelier-panel relative">
        <Corners />
        <div className="atelier-rule mb-6">
          <span className="atelier-smallcaps">Carte d'invitation</span>
        </div>
        <h1
          className="atelier-display"
          style={{ fontSize: "2.2rem", fontStyle: "italic", lineHeight: 1.05 }}
        >
          Join the match
        </h1>

        {isAuthenticated ? (
          <div className="mt-8">
            <button
              type="button"
              onClick={() => void onJoin()}
              className="atelier-btn w-full"
              style={{ padding: "14px 24px" }}
            >
              Accept as {joinAsLabel}
            </button>
          </div>
        ) : (
          <form onSubmit={(e) => void onJoin(e)} className="mt-8 space-y-4">
            <p
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                fontSize: "1.05rem",
                color: "var(--atelier-parchment-soft)",
              }}
            >
              Play anonymously — no membership required. Register later to preserve
              your standing in the ledger.
            </p>
            <input
              required
              value={guestName}
              onChange={(e) => onGuestNameChange(e.target.value)}
              placeholder="Your name for the guest book"
              className="atelier-input"
            />
            <button
              type="submit"
              className="atelier-btn w-full"
              style={{ padding: "14px 24px" }}
            >
              Enter the salon
            </button>
          </form>
        )}

        {error && (
          <p
            className="atelier-smallcaps mt-4"
            style={{ color: "var(--atelier-oxblood)" }}
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

function Corners() {
  return (
    <>
      <span className="atelier-panel__corner atelier-panel__corner--tl" />
      <span className="atelier-panel__corner atelier-panel__corner--tr" />
      <span className="atelier-panel__corner atelier-panel__corner--bl" />
      <span className="atelier-panel__corner atelier-panel__corner--br" />
    </>
  );
}
