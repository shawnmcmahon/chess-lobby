import type { FormEvent } from "react";

export function DefaultProfileSetup({
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
    <div className="mx-auto max-w-md">
      <section className="default-panel default-panel--accent p-6">
        <p className="default-mono text-[0.62rem] uppercase tracking-[0.28em] text-[var(--default-ember-dim)]">
          First light
        </p>
        <h1 className="default-display mt-3 text-3xl">Create your profile</h1>
        <p className="default-mono mt-3 text-sm text-[var(--default-mist)]">
          Choose a display name so other players can find and challenge you.
        </p>
        <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-3">
          <label className="block" htmlFor="default-profile-setup-display-name">
            <span className="default-mono text-[0.62rem] uppercase tracking-[0.2em] text-[var(--default-mist)]">
              Display name
            </span>
            <input
              id="default-profile-setup-display-name"
              name="displayName"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Display name"
              className="default-input mt-2"
            />
          </label>
          <label className="block" htmlFor="default-profile-setup-bio">
            <span className="default-mono text-[0.62rem] uppercase tracking-[0.2em] text-[var(--default-mist)]">
              Bio (optional)
            </span>
            <textarea
              id="default-profile-setup-bio"
              name="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Bio (optional)"
              rows={3}
              className="default-input mt-2 resize-y"
            />
          </label>
          <button type="submit" className="default-btn default-btn--primary w-full">
            Save profile
          </button>
        </form>
        {error && (
          <p className="default-mono mt-4 text-sm text-[var(--default-danger)]">
            {error}
          </p>
        )}
      </section>
    </div>
  );
}
