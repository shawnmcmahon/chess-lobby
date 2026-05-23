import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { getAuthErrorMessage } from "@/lib/authErrors";
import { useTheme } from "@/theme/themeContext";
import { AtelierLogin } from "@/theme/atelier/AtelierLogin";
import { BentoLogin } from "@/theme/bento/BentoLogin";
import { BrutalLogin } from "@/theme/brutal/BrutalLogin";
import { DefaultLogin } from "@/theme/default/DefaultLogin";

export function Login() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn } = useAuthActions();
  const { theme } = useTheme();
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
        setError(getAuthErrorMessage(new Error("InvalidAccountId"), flow));
      }
    } catch (err) {
      setError(getAuthErrorMessage(err, flow));
      if (
        err instanceof Error &&
        err.message.includes("already exists")
      ) {
        setFlow("signIn");
      }
    } finally {
      setPending(false);
    }
  }

  async function onGoogleSignIn() {
    setPending(true);
    setError(null);
    try {
      await signIn("google");
    } catch (err) {
      setError(getAuthErrorMessage(err, flow));
    } finally {
      setPending(false);
    }
  }

  switch (theme) {
    case "atelier":
      return (
        <AtelierLogin
          flow={flow}
          error={error}
          pending={pending}
          isLoading={isLoading}
          formRef={formRef as import("react").RefObject<HTMLFormElement>}
          onEmailSubmit={onEmailSubmit}
          onGoogleSignIn={() => void onGoogleSignIn()}
          onToggleFlow={() => {
            setFlow(flow === "signIn" ? "signUp" : "signIn");
            setError(null);
          }}
        />
      );
    case "bento":
      return (
        <BentoLogin
          flow={flow}
          setFlow={(next) => {
            setFlow(next);
            setError(null);
          }}
          error={error}
          pending={pending}
          isLoading={isLoading}
          onEmailSubmit={onEmailSubmit}
          onGoogleSignIn={onGoogleSignIn}
        />
      );
    case "brutal":
      return (
        <BrutalLogin
          flow={flow}
          setFlow={(next) => {
            setFlow(next);
            setError(null);
          }}
          error={error}
          pending={pending}
          isLoading={isLoading}
          formRef={formRef}
          onEmailSubmit={onEmailSubmit}
          onGoogleSignIn={() => void onGoogleSignIn()}
        />
      );
    default:
      return (
        <DefaultLogin
          flow={flow}
          setFlow={(next) => {
            setFlow(next);
            setError(null);
          }}
          error={error}
          pending={pending}
          isLoading={isLoading}
          onEmailSubmit={onEmailSubmit}
          onGoogleSignIn={onGoogleSignIn}
        />
      );
  }
}
