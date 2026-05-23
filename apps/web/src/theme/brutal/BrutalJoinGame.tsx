import type { FormEvent } from "react";

export type BrutalJoinGameProps =
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

export function BrutalJoinGame(props: BrutalJoinGameProps) {
  if (props.view === "invalid") {
    return (
      <div className="brutal-card brutal-card--magenta brutal-display mx-auto max-w-md" style={{ padding: 22 }}>
        ⚠ INVALID INVITE LINK
      </div>
    );
  }

  if (props.view === "loading") {
    return (
      <p className="brutal-display" style={{ fontSize: "1.4rem", marginTop: 32 }}>
        LOADING GAME…
      </p>
    );
  }

  if (props.view === "notFound") {
    return (
      <div className="brutal-card brutal-card--magenta brutal-display mx-auto max-w-md" style={{ padding: 22 }}>
        ⚠ GAME NOT FOUND
      </div>
    );
  }

  if (props.view === "notWaiting") {
    return (
      <div className="mx-auto max-w-md space-y-5 text-center">
        <section className="brutal-card brutal-card--yellow relative" style={{ padding: 24 }} data-tilt="right">
          <span className="brutal-sticker" style={{ top: -16, left: 24 }} data-tilt="left">
            CLOSED
          </span>
          <p className="brutal-display" style={{ fontSize: "1.2rem" }}>
            THIS GAME IS NO LONGER WAITING FOR PLAYERS.
          </p>
        </section>
        <button type="button" onClick={props.onViewGame} className="brutal-btn brutal-btn--ink">
          ▶ VIEW GAME
        </button>
      </div>
    );
  }

  const { isAuthenticated, joinSideLabel, guestName, setGuestName, onJoin, error } = props;

  return (
    <div className="mx-auto max-w-md">
      <section
        className="brutal-card relative"
        style={{ padding: 28 }}
        data-tilt="left"
      >
        <span className="brutal-sticker brutal-sticker--blue" style={{ top: -18, right: 20 }} data-tilt="right">
          ★ INVITE
        </span>
        <span className="brutal-tape" style={{ marginBottom: 20 }}>
          YOU&apos;VE BEEN SUMMONED
        </span>
        <h1 className="brutal-display" style={{ fontSize: "clamp(1.6rem, 4vw, 2.2rem)" }}>
          JOIN CHESS GAME
        </h1>

        {isAuthenticated ? (
          <button
            type="button"
            onClick={() => void onJoin()}
            className="brutal-btn brutal-btn--magenta mt-8 w-full"
          >
            ▶ JOIN AS {joinSideLabel.toUpperCase()}
          </button>
        ) : (
          <form onSubmit={(e) => void onJoin(e)} className="mt-8 space-y-4">
            <p className="brutal-chunk text-[0.9rem]" style={{ lineHeight: 1.45 }}>
              Play anonymously — no account required. Sign up later to save your profile.
            </p>
            <input
              required
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="YOUR DISPLAY NAME"
              className="brutal-input"
            />
            <button type="submit" className="brutal-btn brutal-btn--ink w-full">
              ▶ JOIN GAME
            </button>
          </form>
        )}

        {error && (
          <div
            className="brutal-card brutal-card--magenta mt-5"
            style={{ padding: 12, boxShadow: "4px 4px 0 var(--brutal-ink)" }}
          >
            <p className="brutal-display" style={{ fontSize: "0.85rem" }}>
              ⚠ {error.toUpperCase()}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
