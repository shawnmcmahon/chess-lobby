import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";

export function Login() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setPending(false);
    }
  }, [isLoading, isAuthenticated]);

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function onEmailSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("flow", flow);

    try {
      const result = await signIn("password", formData);
      if (result.redirect) {
        return;
      }
      if (!result.signingIn) {
        setError(
          flow === "signUp"
            ? "Could not create account. If you already signed up, use Sign in instead."
            : "Sign in failed. Check your email and password.",
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign in failed";
      if (message.includes("already exists")) {
        setError("An account with this email already exists. Use Sign in instead.");
        setFlow("signIn");
      } else if (message.includes("Invalid password")) {
        setError("Incorrect password. Try again or create a new account with a different email.");
      } else {
        setError(message);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 rounded-xl border border-stone-800 bg-[#121218] p-6">
      <h1 className="text-2xl font-semibold text-amber-400">Sign in</h1>

      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          try {
            await signIn("google");
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : "Google sign-in failed. Set AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET on Convex.",
            );
          } finally {
            setPending(false);
          }
        }}
        className="w-full rounded-lg border border-stone-600 py-2 hover:border-amber-600 disabled:opacity-50"
      >
        Continue with Google
      </button>

      <div className="text-center text-xs text-stone-500">or</div>

      <form ref={formRef} onSubmit={(e) => void onEmailSubmit(e)} className="space-y-3">
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Email"
          className="w-full rounded border border-stone-700 bg-stone-900 px-3 py-2 outline-none focus:border-amber-600"
        />
        <input
          name="password"
          type="password"
          required
          autoComplete={flow === "signUp" ? "new-password" : "current-password"}
          placeholder="Password (min 8 characters)"
          minLength={8}
          className="w-full rounded border border-stone-700 bg-stone-900 px-3 py-2 outline-none focus:border-amber-600"
        />
        <button
          type="submit"
          disabled={pending || isLoading}
          className="w-full rounded-lg bg-amber-600 py-2 font-medium text-stone-950 hover:bg-amber-500 disabled:opacity-50"
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
        className="text-sm text-stone-400 hover:text-amber-300"
        onClick={() => {
          setFlow(flow === "signIn" ? "signUp" : "signIn");
          setError(null);
        }}
      >
        {flow === "signIn"
          ? "Need an account? Sign up"
          : "Already have an account? Sign in"}
      </button>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <p className="text-center text-sm text-stone-500">
        <Link to="/" className="hover:text-amber-300">
          Back to home
        </Link>
      </p>
    </div>
  );
}
