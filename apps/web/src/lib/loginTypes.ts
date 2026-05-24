import type { FormEvent } from "react";
import type { AuthFlow } from "@/components/auth/authStyles";

export type ResetStep = null | "request" | { email: string };

export type LoginControllerProps = {
  flow: AuthFlow;
  setFlow: (flow: AuthFlow) => void;
  verifyEmail: boolean;
  setVerifyEmail: (value: boolean) => void;
  verifyStep: { email: string } | null;
  resetStep: ResetStep;
  error: string | null;
  pending: boolean;
  isLoading: boolean;
  onEmailSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onVerificationSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onCancelVerification: () => void;
  onForgotPassword: () => void;
  onForgotPasswordSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onResetVerificationSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onCancelReset: () => void;
  onGoogleSignIn: () => Promise<void>;
};
