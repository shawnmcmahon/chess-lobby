import type { FormEvent } from "react";

export function BentoProfileSetup({
  displayName,
  setDisplayName,
  bio,
  setBio,
  onSubmit,
  error,
}: {
  displayName: string;
  setDisplayName: (value: string) => void;
  bio: string;
  setBio: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  error: string | null;
}) {
  return (
    <div className="bento-grid" style={{ marginTop: 16 }}>
      <section
        className="bento-tile bento-tile--bone col-span-12 lg:col-span-5"
        style={{ padding: 36, animationDelay: "0ms", minHeight: 300 }}
      >
        <div className="bento-pill">Onboarding</div>
        <h1
          className="bento-tile__title"
          style={{ fontSize: "2.4rem", marginTop: 20, maxWidth: "12ch" }}
        >
          Claim your <em>name</em>
        </h1>
        <p
          className="bento-mono mt-4 text-[0.72rem] opacity-70"
          style={{ lineHeight: 1.65, maxWidth: "36ch" }}
        >
          Choose a display name so other players can find and challenge you in
          the lobby. Bio is optional — a short note for your public profile.
        </p>
      </section>

      <section
        className="bento-tile col-span-12 lg:col-span-7"
        style={{ padding: 32, animationDelay: "80ms" }}
      >
        <div className="bento-tile__eyebrow">Profile</div>
        <h2
          className="bento-tile__title"
          style={{ fontSize: "1.5rem", marginTop: 6 }}
        >
          Create your <em>profile</em>
        </h2>

        <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-3">
          <label className="block">
            <span className="bento-mono text-[0.66rem] uppercase tracking-widest opacity-60">
              Display name
            </span>
            <input
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Display name"
              className="bento-input mt-2"
            />
          </label>
          <label className="block">
            <span className="bento-mono text-[0.66rem] uppercase tracking-widest opacity-60">
              Bio (optional)
            </span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A line about your chess style…"
              rows={3}
              className="bento-input mt-2 resize-none"
            />
          </label>
          <button
            type="submit"
            className="bento-btn bento-btn--jade w-full justify-center"
            style={{ display: "flex" }}
          >
            Save profile →
          </button>
        </form>

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
