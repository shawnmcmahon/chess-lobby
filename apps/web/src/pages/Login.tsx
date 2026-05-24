import { useAuthActions } from "@convex-dev/auth/react";

import { useConvexAuth } from "convex/react";

import { useEffect, useState, type FormEvent } from "react";

import { Navigate } from "react-router-dom";

import type { AuthFlow } from "@/components/auth/authStyles";
import { getAuthErrorMessage } from "@/lib/authErrors";
import type { LoginControllerProps, ResetStep } from "@/lib/loginTypes";

import { useTheme } from "@/theme/themeContext";

import { AtelierLogin } from "@/theme/atelier/AtelierLogin";

import { BentoLogin } from "@/theme/bento/BentoLogin";

import { BrutalLogin } from "@/theme/brutal/BrutalLogin";

import { DefaultLogin } from "@/theme/default/DefaultLogin";

export type { LoginControllerProps, ResetStep } from "@/lib/loginTypes";



export function Login() {

  const { isAuthenticated, isLoading } = useConvexAuth();

  const { signIn } = useAuthActions();

  const { theme } = useTheme();

  const [flow, setFlow] = useState<AuthFlow>("signIn");

  const [verifyEmail, setVerifyEmail] = useState(false);

  const [verifyStep, setVerifyStep] = useState<{ email: string } | null>(null);
  const [resetStep, setResetStep] = useState<ResetStep>(null);

  const [error, setError] = useState<string | null>(null);

  const [pending, setPending] = useState(false);



  useEffect(() => {

    if (!isLoading && isAuthenticated) {

      setPending(false);

      setVerifyStep(null);
      setResetStep(null);

    }

  }, [isLoading, isAuthenticated]);



  if (!isLoading && isAuthenticated) {

    return <Navigate to="/dashboard" replace />;

  }



  function resetErrors() {

    setError(null);

  }



  function handleSetFlow(next: AuthFlow) {
    setFlow(next);
    setVerifyEmail(false);
    setVerifyStep(null);
    setResetStep(null);
    resetErrors();
  }

  function onForgotPassword() {
    setResetStep("request");
    setVerifyStep(null);
    resetErrors();
  }

  function onCancelReset() {
    setResetStep(null);
    resetErrors();
  }

  async function onForgotPasswordSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    resetErrors();

    const formData = new FormData(e.currentTarget);
    formData.set("flow", "reset");

    try {
      await signIn("password", formData);
      const email = String(formData.get("email") ?? "");
      if (email) {
        setResetStep({ email });
      }
    } catch (err) {
      setError(getAuthErrorMessage(err, "signIn"));
    } finally {
      setPending(false);
    }
  }

  async function onResetVerificationSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    resetErrors();

    const formData = new FormData(e.currentTarget);
    formData.set("flow", "reset-verification");

    try {
      const result = await signIn("password", formData);
      if (result.redirect) {
        return;
      }
      if (!result.signingIn) {
        setError("Invalid reset code or password. Try again.");
        return;
      }
      setResetStep(null);
    } catch (err) {
      setError(getAuthErrorMessage(err, "signIn"));
    } finally {
      setPending(false);
    }
  }

  async function onEmailSubmit(e: FormEvent<HTMLFormElement>) {

    e.preventDefault();

    setPending(true);

    resetErrors();



    const form = e.currentTarget;

    const formData = new FormData(form);

    formData.set("flow", flow);



    if (flow === "signUp") {

      const password = formData.get("password");

      const confirmPassword = formData.get("confirmPassword");

      if (password !== confirmPassword) {

        setError("Passwords do not match.");

        setPending(false);

        return;

      }

      if (!verifyEmail) {

        formData.delete("requestEmailVerification");

      }

    } else {

      formData.delete("requestEmailVerification");

      formData.delete("confirmPassword");

    }



    try {

      const result = await signIn("password", formData);

      if (result.redirect) {

        return;

      }

      if (!result.signingIn) {

        const email = String(formData.get("email") ?? "");

        if (email) {

          setVerifyStep({ email });

        } else {

          setError(getAuthErrorMessage(new Error("InvalidAccountId"), flow));

        }

        return;

      }

      setVerifyStep(null);

    } catch (err) {

      setError(getAuthErrorMessage(err, flow));

      if (err instanceof Error && err.message.includes("already exists")) {

        handleSetFlow("signIn");

      }

    } finally {

      setPending(false);

    }

  }



  async function onVerificationSubmit(e: FormEvent<HTMLFormElement>) {

    e.preventDefault();

    setPending(true);

    resetErrors();



    const formData = new FormData(e.currentTarget);

    formData.set("flow", "email-verification");



    try {

      const result = await signIn("password", formData);

      if (result.redirect) {

        return;

      }

      if (!result.signingIn) {

        setError("Invalid verification code. Try again.");

      } else {

        setVerifyStep(null);

      }

    } catch (err) {

      setError(getAuthErrorMessage(err, "signIn"));

    } finally {

      setPending(false);

    }

  }



  function onCancelVerification() {

    setVerifyStep(null);

    resetErrors();

  }



  async function onGoogleSignIn() {

    setPending(true);

    resetErrors();

    try {

      await signIn("google");

    } catch (err) {

      setError(getAuthErrorMessage(err, flow));

    } finally {

      setPending(false);

    }

  }



  const shared: LoginControllerProps = {

    flow,

    setFlow: handleSetFlow,

    verifyEmail,

    setVerifyEmail,

    verifyStep,
    resetStep,
    error,
    pending,
    isLoading,
    onEmailSubmit,
    onVerificationSubmit,
    onCancelVerification,
    onForgotPassword,
    onForgotPasswordSubmit,
    onResetVerificationSubmit,
    onCancelReset,
    onGoogleSignIn,
  };



  switch (theme) {

    case "atelier":

      return <AtelierLogin {...shared} />;

    case "bento":

      return <BentoLogin {...shared} />;

    case "brutal":

      return <BrutalLogin {...shared} />;

    default:

      return <DefaultLogin {...shared} />;

  }

}


