import type { FormEvent } from "react";

export type BrutalProfileSetupProps = {
  displayName: string;
  setDisplayName: (name: string) => void;
  bio: string;
  setBio: (bio: string) => void;
  error: string | null;
  onSubmit: (e: FormEvent) => void;
};

export function BrutalProfileSetup({
  displayName,
  setDisplayName,
  bio,
  setBio,
  error,
  onSubmit,
}: BrutalProfileSetupProps) {
  return (
    <div className="mx-auto max-w-md">
      <section
        className="brutal-card brutal-card--yellow relative"
        style={{ padding: 28 }}
        data-tilt="right"
      >
        <span className="brutal-sticker brutal-sticker--magenta" style={{ top: -18, left: 24 }} data-tilt="left">
          NEW FACE
        </span>
        <span className="brutal-tape" style={{ position: "absolute", top: -14, right: 28 }}>
          ★ INTRODUCE YOURSELF
        </span>
        <h1 className="brutal-display" style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)" }}>
          CREATE YOUR PROFILE
        </h1>
        <p className="brutal-chunk mt-4 text-[0.95rem]" style={{ lineHeight: 1.45 }}>
          Pick a display name so other players can find and challenge you.
        </p>

        <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-4">
          <label className="block">
            <span className="brutal-display text-[0.8rem]">DISPLAY NAME</span>
            <input
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="WHAT THEY CALL YOU"
              className="brutal-input mt-2"
            />
          </label>
          <label className="block">
            <span className="brutal-display text-[0.8rem]">BIO (OPTIONAL)</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="YOUR TRASH-TALK MANIFESTO"
              rows={3}
              className="brutal-input mt-2 resize-y"
            />
          </label>
          <button type="submit" className="brutal-btn brutal-btn--ink w-full">
            ▶ SAVE PROFILE
          </button>
        </form>

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
