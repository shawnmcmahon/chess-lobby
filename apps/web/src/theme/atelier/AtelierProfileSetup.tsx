import type { FormEvent } from "react";

export type AtelierProfileSetupProps = {
  displayName: string;
  onDisplayNameChange: (value: string) => void;
  bio: string;
  onBioChange: (value: string) => void;
  error: string | null;
  onSubmit: (e: FormEvent) => void;
};

export function AtelierProfileSetup({
  displayName,
  onDisplayNameChange,
  bio,
  onBioChange,
  error,
  onSubmit,
}: AtelierProfileSetupProps) {
  return (
    <div className="mx-auto max-w-md relative">
      <div className="atelier-panel relative">
        <Corners />
        <div className="atelier-rule mb-6">
          <span className="atelier-smallcaps">New member · Registry</span>
        </div>
        <h1
          className="atelier-display"
          style={{ fontSize: "2.4rem", fontStyle: "italic", lineHeight: 1.05 }}
        >
          Inscribe your name
        </h1>
        <p
          className="mt-3"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            color: "var(--atelier-parchment-soft)",
          }}
        >
          Choose a display name so fellow patrons may find and challenge you.
        </p>

        <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-4">
          <label className="block">
            <span className="atelier-smallcaps" style={{ color: "var(--atelier-brass)" }}>
              Display name
            </span>
            <input
              required
              value={displayName}
              onChange={(e) => onDisplayNameChange(e.target.value)}
              placeholder="As you wish to be known"
              className="atelier-input mt-2"
            />
          </label>
          <label className="block">
            <span className="atelier-smallcaps" style={{ color: "var(--atelier-brass)" }}>
              Biography (optional)
            </span>
            <textarea
              value={bio}
              onChange={(e) => onBioChange(e.target.value)}
              placeholder="A few words for the guest book"
              rows={3}
              className="atelier-input mt-2 resize-none"
            />
          </label>
          <button
            type="submit"
            className="atelier-btn w-full"
            style={{ padding: "14px 24px" }}
          >
            Seal the registry
          </button>
        </form>

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
