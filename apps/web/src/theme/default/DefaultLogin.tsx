import { Link } from "react-router-dom";
import type { FormEvent } from "react";

export function DefaultLogin({
  flow,
  setFlow,
  error,
  pending,
  isLoading,
  onEmailSubmit,
  onGoogleSignIn,
}: {
  flow: "signIn" | "signUp";
  setFlow: (flow: "signIn" | "signUp") => void;
  error: string | null;
  pending: boolean;
  isLoading: boolean;
  onEmailSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onGoogleSignIn: () => Promise<void>;
}) {
  return (
    <div className="mx-auto max-w-md">
      <section className="default-panel default-panel--accent p-6">
        <p className="default-mono text-[0.62rem] uppercase tracking-[0.28em] text-[var(--default-ember-dim)]">
          Observatory access
        </p>
        <h1 className="default-display mt-3 text-3xl">
          {flow === "signIn" ? "Sign in" : "Create account"}
        </h1>
        <p className="default-mono mt-3 text-sm text-[var(--default-mist)]">
          Google or email. Your games and rating sync across devices.
        </p>

        <button
          type="button"
          disabled={pending}
          onClick={() => void onGoogleSignIn()}
          className="default-btn default-btn--ghost mt-6 w-full"
        >
          Continue with Google
        </button>

        <div className="default-mono my-4 text-center text-xs uppercase tracking-widest text-[var(--default-mist)]">
          or
        </div>

        <form onSubmit={(e) => void onEmailSubmit(e)} className="space-y-3">
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="Email"
            className="default-input"
          />
          <input
            name="password"
            type="password"
            required
            autoComplete={flow === "signUp" ? "new-password" : "current-password"}
            placeholder="Password (min 8 characters)"
            minLength={8}
            className="default-input"
          />
          <button
            type="submit"
            disabled={pending || isLoading}
            className="default-btn default-btn--primary w-full"
          >
            {pending || isLoading
              ? "Signing in…"
              : flow === "signIn"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <button
          type="button"
          className="default-mono mt-4 text-sm text-[var(--default-mist)] hover:text-[var(--default-ember)]"
          onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
        >
          {flow === "signIn"
            ? "Need an account? Sign up"
            : "Already have an account? Sign in"}
        </button>

        <p className="default-mono mt-6 text-center text-sm text-[var(--default-mist)]">
          <Link to="/" className="hover:text-[var(--default-ember)]">
            Back to home
          </Link>
        </p>

        {error && (
          <div role="alert" className="default-alert mt-4">
            {error}
          </div>
        )}
      </section>
    </div>
  );
}
