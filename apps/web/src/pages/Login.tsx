import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useMutation } from "convex/react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api } from "../../../../convex/_generated/api";

export function Login() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn } = useAuthActions();
  const syncProfile = useMutation(api.users.syncProfile);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      void syncProfile().then(() => navigate("/dashboard"));
    }
  }, [isLoading, isAuthenticated, syncProfile, navigate]);

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function onEmailSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await signIn("password", { email, password, flow });
      await syncProfile();
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
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
        onClick={() => void signIn("google")}
        className="w-full rounded-lg border border-stone-600 py-2 hover:border-amber-600"
      >
        Continue with Google
      </button>

      <div className="text-center text-xs text-stone-500">or</div>

      <form onSubmit={(e) => void onEmailSubmit(e)} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded border border-stone-700 bg-stone-900 px-3 py-2 outline-none focus:border-amber-600"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded border border-stone-700 bg-stone-900 px-3 py-2 outline-none focus:border-amber-600"
        />
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-amber-600 py-2 font-medium text-stone-950 hover:bg-amber-500 disabled:opacity-50"
        >
          {flow === "signIn" ? "Sign in" : "Create account"}
        </button>
      </form>

      <button
        type="button"
        className="text-sm text-stone-400 hover:text-amber-300"
        onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
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
