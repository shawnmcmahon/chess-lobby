import { Link } from "react-router-dom";
import type { FormEvent, RefObject } from "react";

export type BrutalLoginProps = {
  flow: "signIn" | "signUp";
  setFlow: (flow: "signIn" | "signUp") => void;
  error: string | null;
  pending: boolean;
  isLoading: boolean;
  formRef: RefObject<HTMLFormElement | null>;
  onEmailSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onGoogleSignIn: () => void;
};

export function BrutalLogin({
  flow,
  setFlow,
  error,
  pending,
  isLoading,
  formRef,
  onEmailSubmit,
  onGoogleSignIn,
}: BrutalLoginProps) {
  return (
    <div className="mx-auto max-w-md">
      <section
        className="brutal-card brutal-card--ink relative"
        style={{ padding: 28 }}
        data-tilt="left"
      >
        <span className="brutal-sticker brutal-sticker--magenta" style={{ top: -18, right: 24 }} data-tilt="right">
          ★ ACCESS
        </span>
        <span className="brutal-tape" style={{ position: "absolute", top: -14, left: 28 }}>
          MEMBERS ONLY (KIDDING)
        </span>
        <h1 className="brutal-display" style={{ fontSize: "clamp(2rem, 5vw, 2.8rem)" }}>
          {flow === "signIn" ? "SIGN IN" : "SIGN UP"}
        </h1>
        <p className="brutal-chunk mt-3" style={{ fontSize: "0.95rem", color: "var(--brutal-paper)" }}>
          Google or email. No velvet rope. Just chess.
        </p>

        <button
          type="button"
          disabled={pending}
          onClick={onGoogleSignIn}
          className="brutal-btn brutal-btn--yellow mt-8 w-full"
        >
          ▶ CONTINUE WITH GOOGLE
        </button>

        <div className="brutal-display my-5 text-center" style={{ fontSize: "0.75rem", color: "var(--brutal-magenta)" }}>
          — OR —
        </div>

        <form ref={formRef} onSubmit={(e) => void onEmailSubmit(e)} className="space-y-3">
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="EMAIL"
            className="brutal-input"
          />
          <input
            name="password"
            type="password"
            required
            autoComplete={flow === "signUp" ? "new-password" : "current-password"}
            placeholder="PASSWORD (MIN 8)"
            minLength={8}
            className="brutal-input"
          />
          <button
            type="submit"
            disabled={pending || isLoading}
            className="brutal-btn brutal-btn--magenta w-full"
          >
            {pending || isLoading
              ? "↻ WORKING…"
              : flow === "signIn"
                ? "▶ SIGN IN"
                : "▶ CREATE ACCOUNT"}
          </button>
        </form>

        <button
          type="button"
          className="brutal-chunk mt-4 block w-full text-left text-[0.9rem] hover:underline"
          style={{ color: "var(--brutal-yellow)" }}
          onClick={() => {
            setFlow(flow === "signIn" ? "signUp" : "signIn");
          }}
        >
          {flow === "signIn"
            ? "→ NEED AN ACCOUNT? SIGN UP"
            : "→ ALREADY IN? SIGN IN"}
        </button>

        <p className="brutal-chunk mt-6 text-center text-[0.85rem]">
          <Link to="/" className="brutal-display hover:underline" style={{ fontSize: "0.85rem" }}>
            ← BACK TO HOME
          </Link>
        </p>

        {error && (
          <div
            role="alert"
            className="brutal-card brutal-card--magenta mt-5"
            style={{ padding: 12, boxShadow: "4px 4px 0 var(--brutal-yellow)" }}
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
