import type { FormEvent } from "react";

export type DefaultJoinGameProps =
  | { view: "invalid" }
  | { view: "loading" }
  | { view: "notFound" }
  | { view: "notWaiting"; onViewGame: () => void }
  | {
      view: "join";
      isAuthenticated: boolean;
      joinSideLabel: string;
      guestName: string;
      setGuestName: (name: string) => void;
      onJoin: (e?: FormEvent) => void;
      error: string | null;
    };

export function DefaultJoinGame(props: DefaultJoinGameProps) {
  if (props.view === "invalid") {
    return (
      <div className="default-alert mx-auto max-w-md">Invalid invite link.</div>
    );
  }

  if (props.view === "loading") {
    return (
      <p className="default-mono text-[var(--default-mist)]">Loading game…</p>
    );
  }

  if (props.view === "notFound") {
    return (
      <div className="default-alert mx-auto max-w-md">Game not found.</div>
    );
  }

  if (props.view === "notWaiting") {
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <section className="default-panel p-6">
          <p>This game is no longer waiting for players.</p>
        </section>
        <button
          type="button"
          onClick={props.onViewGame}
          className="default-btn default-btn--primary"
        >
          View game
        </button>
      </div>
    );
  }

  const { isAuthenticated, joinSideLabel, guestName, setGuestName, onJoin, error } =
    props;

  return (
    <div className="mx-auto max-w-md">
      <section className="default-panel default-panel--accent p-6">
        <p className="default-mono text-[0.62rem] uppercase tracking-[0.28em] text-[var(--default-ember-dim)]">
          Invitation
        </p>
        <h1 className="default-display mt-3 text-2xl">Join chess game</h1>

        {isAuthenticated ? (
          <button
            type="button"
            onClick={() => void onJoin()}
            className="default-btn default-btn--primary mt-6 w-full"
          >
            Join as {joinSideLabel}
          </button>
        ) : (
          <form onSubmit={(e) => void onJoin(e)} className="mt-6 space-y-3">
            <p className="default-mono text-sm text-[var(--default-mist)]">
              Play anonymously — no account required. You can sign up later to save
              your profile.
            </p>
            <input
              required
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Your display name"
              className="default-input"
            />
            <button type="submit" className="default-btn default-btn--primary w-full">
              Join game
            </button>
          </form>
        )}

        {error && (
          <p className="default-mono mt-4 text-sm text-[var(--default-danger)]">
            {error}
          </p>
        )}
      </section>
    </div>
  );
}
