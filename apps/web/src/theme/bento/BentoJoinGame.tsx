import type { FormEvent, ReactNode } from "react";
import type { Doc, Id } from "../../../../../convex/_generated/dataModel";

export type BentoJoinGameProps =
  | { state: "invalid-token" }
  | { state: "loading" }
  | { state: "not-found" }
  | {
      state: "not-waiting";
      gameId: Id<"games">;
      onViewGame: () => void;
    }
  | {
      state: "ready";
      game: Doc<"games">;
      isAuthenticated: boolean;
      guestName: string;
      setGuestName: (name: string) => void;
      onJoin: (e?: FormEvent) => void;
      error: string | null;
    };

export function BentoJoinGame(props: BentoJoinGameProps) {
  if (props.state === "invalid-token") {
    return (
      <MessageTile
        eyebrow="Invite"
        title={
          <>
            Invalid <em>link</em>
          </>
        }
        text="This invite URL is malformed. Ask your opponent for a fresh link."
        tone="clay"
      />
    );
  }

  if (props.state === "loading") {
    return (
      <MessageTile
        eyebrow="Invite"
        title="Loading…"
        text="Fetching game details from the lobby."
        tone="paper"
      />
    );
  }

  if (props.state === "not-found") {
    return (
      <MessageTile
        eyebrow="Invite"
        title={
          <>
            Game <em>not found</em>
          </>
        }
        text="This invite may have expired or the game was removed."
        tone="clay"
      />
    );
  }

  if (props.state === "not-waiting") {
    return (
      <div className="bento-grid" style={{ marginTop: 16 }}>
        <section
          className="bento-tile bento-tile--bone col-span-12 lg:col-span-6"
          style={{ padding: 32, animationDelay: "0ms" }}
        >
          <div className="bento-tile__eyebrow">Invite</div>
          <h1
            className="bento-tile__title"
            style={{ fontSize: "2rem", marginTop: 10 }}
          >
            Already <em>in play</em>
          </h1>
          <p className="bento-mono mt-4 text-[0.75rem] opacity-70" style={{ lineHeight: 1.6 }}>
            This game is no longer waiting for players. You can still spectate
            or rejoin if you were a participant.
          </p>
          <button
            type="button"
            onClick={props.onViewGame}
            className="bento-btn bento-btn--jade mt-6"
          >
            View game →
          </button>
        </section>
      </div>
    );
  }

  const { game, isAuthenticated, guestName, setGuestName, onJoin, error } = props;
  const seat = game.whiteUserId ? "black" : "white";

  return (
    <div className="bento-grid" style={{ marginTop: 16 }}>
      <section
        className="bento-tile bento-tile--jade col-span-12 lg:col-span-5"
        style={{ padding: 32, animationDelay: "0ms", minHeight: 280 }}
      >
        <div className="bento-pill">Invitation</div>
        <h1
          className="bento-tile__title"
          style={{ fontSize: "2.4rem", marginTop: 20 }}
        >
          Join the <em>board</em>
        </h1>
        <p
          className="bento-mono mt-4 text-[0.72rem] opacity-85"
          style={{ lineHeight: 1.65 }}
        >
          You've been invited to a chess game. Take the {seat} pieces and the
          clock starts when both players are seated.
        </p>
        <div className="bento-divider" />
        <div className="bento-mono text-[0.68rem] uppercase tracking-widest opacity-70">
          seat · {seat}
        </div>
      </section>

      <section
        className="bento-tile col-span-12 lg:col-span-7"
        style={{ padding: 32, animationDelay: "80ms" }}
      >
        <div className="bento-tile__eyebrow">Ready?</div>
        <h2
          className="bento-tile__title"
          style={{ fontSize: "1.5rem", marginTop: 6 }}
        >
          {isAuthenticated ? (
            <>Join as <em>{seat}</em></>
          ) : (
            <>Play as a <em>guest</em></>
          )}
        </h2>

        {isAuthenticated ? (
          <button
            type="button"
            onClick={() => void onJoin()}
            className="bento-btn bento-btn--jade mt-6 w-full justify-center"
            style={{ display: "flex" }}
          >
            Join as {seat}
          </button>
        ) : (
          <form onSubmit={(e) => void onJoin(e)} className="mt-6 space-y-3">
            <p className="bento-mono text-[0.72rem] opacity-65" style={{ lineHeight: 1.6 }}>
              No account required — pick a display name. Sign up later to save
              your profile and rating history.
            </p>
            <input
              required
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Your display name"
              className="bento-input"
            />
            <button
              type="submit"
              className="bento-btn bento-btn--jade w-full justify-center"
              style={{ display: "flex" }}
            >
              Join game
            </button>
          </form>
        )}

        {error && (
          <p
            className="bento-mono mt-4 text-sm"
            style={{ color: "var(--bento-clay)" }}
          >
            {error}
          </p>
        )}
      </section>
    </div>
  );
}

function MessageTile({
  eyebrow,
  title,
  text,
  tone,
}: {
  eyebrow: string;
  title: ReactNode;
  text: string;
  tone: "paper" | "clay";
}) {
  return (
    <div className="bento-grid" style={{ marginTop: 16 }}>
      <section
        className={`bento-tile ${tone === "clay" ? "bento-tile--clay" : ""} col-span-12 lg:col-span-6`}
        style={{ padding: 32, animationDelay: "0ms" }}
      >
        <div className="bento-tile__eyebrow">{eyebrow}</div>
        <h1
          className="bento-tile__title"
          style={{ fontSize: "2rem", marginTop: 10 }}
        >
          {title}
        </h1>
        <p className="bento-mono mt-4 text-[0.75rem] opacity-80" style={{ lineHeight: 1.6 }}>
          {text}
        </p>
      </section>
    </div>
  );
}
