import { Link } from "react-router-dom";
import type { FormEvent } from "react";
import { PasswordField } from "@/components/PasswordField";

export function BentoLogin({
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
    <div className="bento-grid" style={{ marginTop: 16 }}>
      <section
        className="bento-tile bento-tile--ink col-span-12 lg:col-span-5"
        style={{ padding: 36, animationDelay: "0ms", minHeight: 320 }}
      >
        <div className="bento-pill">Access · No. 001</div>
        <h1
          className="bento-tile__title"
          style={{ fontSize: "2.6rem", marginTop: 24, maxWidth: "14ch" }}
        >
          {flow === "signIn" ? (
            <>
              Welcome <em>back</em>
            </>
          ) : (
            <>
              Join the <em>lobby</em>
            </>
          )}
        </h1>
        <p
          className="bento-mono"
          style={{
            marginTop: 20,
            fontSize: "0.75rem",
            lineHeight: 1.7,
            opacity: 0.75,
            maxWidth: "38ch",
          }}
        >
          Sign in with Google or email. Your games, rating, and correspondence
          queue sync across devices.
        </p>
        <div className="bento-divider" />
        <p className="bento-mono text-[0.68rem] uppercase tracking-widest opacity-50">
          chess-lobby · edition 2026
        </p>
      </section>

      <section
        className="bento-tile col-span-12 lg:col-span-7"
        style={{ padding: 32, animationDelay: "80ms" }}
      >
        <div className="bento-tile__eyebrow">Sign in</div>
        <h2
          className="bento-tile__title"
          style={{ fontSize: "1.6rem", marginTop: 6 }}
        >
          {flow === "signIn" ? "Enter your account" : "Create an account"}
        </h2>

        <button
          type="button"
          disabled={pending}
          onClick={() => void onGoogleSignIn()}
          className="bento-btn bento-btn--ghost mt-6 w-full justify-center"
          style={{ display: "flex" }}
        >
          Continue with Google
        </button>

        <div className="bento-mono my-4 text-center text-[0.68rem] uppercase tracking-widest opacity-50">
          or
        </div>

        <form onSubmit={(e) => void onEmailSubmit(e)} className="space-y-3">
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="Email"
            className="bento-input"
          />
          <PasswordField flow={flow} inputClassName="bento-input" />
          <button
            type="submit"
            disabled={pending || isLoading}
            className="bento-btn bento-btn--jade w-full justify-center"
            style={{ display: "flex" }}
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
          className="bento-mono mt-4 text-[0.78rem] opacity-70 hover:opacity-100"
          onClick={() => {
            setFlow(flow === "signIn" ? "signUp" : "signIn");
          }}
        >
          {flow === "signIn"
            ? "Need an account? Sign up"
            : "Already have an account? Sign in"}
        </button>

        <div className="bento-divider" />

        <p className="bento-mono text-center text-[0.72rem] opacity-60">
          <Link to="/" className="hover:underline">
            ← Back to home
          </Link>
        </p>

        {error && (
          <div
            role="alert"
            className="bento-mono mt-4 rounded-xl px-3 py-2 text-sm"
            style={{
              background: "rgba(200, 74, 33, 0.12)",
              color: "var(--bento-clay)",
              border: "1px solid rgba(200, 74, 33, 0.25)",
            }}
          >
            {error}
          </div>
        )}
      </section>
    </div>
  );
}
