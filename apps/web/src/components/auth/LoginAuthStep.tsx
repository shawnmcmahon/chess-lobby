import { AuthEmailForm } from "@/components/auth/AuthEmailForm";
import { EmailVerificationStep } from "@/components/auth/EmailVerificationStep";
import { ForgotPasswordStep } from "@/components/auth/ForgotPasswordStep";
import { PasswordResetVerificationStep } from "@/components/auth/PasswordResetVerificationStep";
import type { HeaderVariant } from "@/components/ResponsiveHeader";
import type { LoginControllerProps } from "@/lib/loginTypes";

export function LoginAuthStep({
  variant,
  flow,
  setFlow,
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
}: Pick<
  LoginControllerProps,
  | "flow"
  | "setFlow"
  | "verifyEmail"
  | "setVerifyEmail"
  | "verifyStep"
  | "resetStep"
  | "error"
  | "pending"
  | "isLoading"
  | "onEmailSubmit"
  | "onVerificationSubmit"
  | "onCancelVerification"
  | "onForgotPassword"
  | "onForgotPasswordSubmit"
  | "onResetVerificationSubmit"
  | "onCancelReset"
  | "onGoogleSignIn"
> & {
  variant: HeaderVariant;
}) {
  if (resetStep === "request") {
    return (
      <ForgotPasswordStep
        pending={pending}
        error={error}
        onSubmit={onForgotPasswordSubmit}
        onCancel={onCancelReset}
        variant={variant}
      />
    );
  }

  if (resetStep) {
    return (
      <PasswordResetVerificationStep
        email={resetStep.email}
        pending={pending}
        error={error}
        onSubmit={onResetVerificationSubmit}
        onCancel={onCancelReset}
        variant={variant}
      />
    );
  }

  if (verifyStep) {
    return (
      <EmailVerificationStep
        email={verifyStep.email}
        pending={pending}
        error={error}
        onSubmit={onVerificationSubmit}
        onCancel={onCancelVerification}
        variant={variant}
      />
    );
  }

  return (
    <AuthEmailForm
      flow={flow}
      setFlow={setFlow}
      verifyEmail={verifyEmail}
      setVerifyEmail={setVerifyEmail}
      error={error}
      pending={pending}
      isLoading={isLoading}
      onEmailSubmit={onEmailSubmit}
      onGoogleSignIn={onGoogleSignIn}
      onForgotPassword={onForgotPassword}
      variant={variant}
    />
  );
}

export function loginStepTitle(
  props: Pick<LoginControllerProps, "flow" | "verifyStep" | "resetStep">,
  titles: {
    signIn: string;
    signUp: string;
    verify: string;
    resetRequest: string;
    resetVerify: string;
  },
): string {
  if (props.resetStep === "request") return titles.resetRequest;
  if (props.resetStep) return titles.resetVerify;
  if (props.verifyStep) return titles.verify;
  return props.flow === "signIn" ? titles.signIn : titles.signUp;
}

export function loginStepSubtitle(
  props: Pick<LoginControllerProps, "verifyStep" | "resetStep">,
  subtitles: {
    default: string;
    verify: string;
    resetRequest: string;
    resetVerify: string;
  },
): string {
  if (props.resetStep === "request") return subtitles.resetRequest;
  if (props.resetStep) return subtitles.resetVerify;
  if (props.verifyStep) return subtitles.verify;
  return subtitles.default;
}
