import { Link } from "react-router-dom";
import type { FormEvent, RefObject } from "react";

export type AtelierLoginProps = {
  flow: "signIn" | "signUp";
  error: string | null;
  pending: boolean;
  isLoading: boolean;
  formRef: RefObject<HTMLFormElement>;
  onEmailSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onGoogleSignIn: () => void;
  onToggleFlow: () => void;
};

export function AtelierLogin({
  flow,
  error,
  pending,
  isLoading,
  formRef,
  onEmailSubmit,
  onGoogleSignIn,
  onToggleFlow,
}: AtelierLoginProps) {
  return (
    <div className="mx-auto max-w-md relative">
      <span
        aria-hidden
        className="atelier-knight"
        style={{ top: "-2rem", right: "-6rem", fontSize: "18rem" }}
      >
        ♞
      </span>

      <div className="atelier-panel relative">
        <Corners />
        <div className="atelier-rule mb-6">
          <span className="atelier-smallcaps">Maison Échecs · Access</span>
        </div>
        <h1
          className="atelier-display text-center"
          style={{ fontSize: "2.4rem", fontStyle: "italic", lineHeight: 1.05 }}
        >
          {flow === "signIn" ? "Procure access" : "Establish membership"}
        </h1>
        <p
          className="mt-3 text-center"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            color: "var(--atelier-parchment-soft)",
          }}
        >
          The salon awaits your credentials.
        </p>

        <div className="mt-8 space-y-4">
          <button
            type="button"
            disabled={pending}
            onClick={onGoogleSignIn}
            className="atelier-btn w-full"
            style={{ padding: "14px 24px" }}
          >
            Continue with Google
          </button>

          <div className="atelier-rule">
            <span className="atelier-smallcaps">or by post</span>
          </div>

          <form ref={formRef} onSubmit={(e) => void onEmailSubmit(e)} className="space-y-3">
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="Email address"
              className="atelier-input"
            />
            <input
              name="password"
              type="password"
              required
              autoComplete={flow === "signUp" ? "new-password" : "current-password"}
              placeholder="Password (min 8 characters)"
              minLength={8}
              className="atelier-input"
            />
            <button
              type="submit"
              disabled={pending || isLoading}
              className="atelier-btn w-full"
              style={{ padding: "14px 24px" }}
            >
              {pending || isLoading
                ? "Verifying…"
                : flow === "signIn"
                  ? "Enter the salon"
                  : "Create membership"}
            </button>
          </form>

          <button
            type="button"
            className="atelier-smallcaps w-full text-center"
            style={{
              color: "var(--atelier-brass)",
              background: "none",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
              textDecorationStyle: "dotted",
            }}
            onClick={onToggleFlow}
          >
            {flow === "signIn"
              ? "Need an account? Sign up"
              : "Already a member? Sign in"}
          </button>

          <p className="text-center">
            <Link
              to="/"
              className="atelier-smallcaps"
              style={{ color: "var(--atelier-brass-dim)" }}
            >
              ← Return to the atelier
            </Link>
          </p>

          {error && (
            <div
              role="alert"
              className="atelier-panel atelier-panel--parchment"
              style={{ padding: "12px 16px", borderColor: "var(--atelier-oxblood)" }}
            >
              <p
                className="atelier-smallcaps"
                style={{ color: "var(--atelier-oxblood)" }}
              >
                {error}
              </p>
            </div>
          )}
        </div>
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
