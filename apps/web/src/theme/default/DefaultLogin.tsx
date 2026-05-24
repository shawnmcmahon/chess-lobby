import { Link } from "react-router-dom";
import { loginStepSubtitle, loginStepTitle, LoginAuthStep } from "@/components/auth/LoginAuthStep";
import type { LoginControllerProps } from "@/lib/loginTypes";

export function DefaultLogin(props: LoginControllerProps) {
  const title = loginStepTitle(props, {
    signIn: "Welcome back",
    signUp: "Create account",
    verify: "Verify your email",
    resetRequest: "Forgot password",
    resetVerify: "Choose a new password",
  });

  const subtitle = loginStepSubtitle(props, {
    default: "Google or email. Your games and rating sync across devices.",
    verify: "Enter the code we emailed you to finish setting up your account.",
    resetRequest: "Enter your account email and we will send a reset code.",
    resetVerify: "Enter the code from your email and a new password.",
  });

  return (
    <div className="mx-auto max-w-md">
      <section className="default-panel default-panel--accent p-6">
        <p className="default-mono text-[0.62rem] uppercase tracking-[0.28em] text-[var(--default-ember-dim)]">
          Chess Lobby
        </p>
        <h1 className="default-display mt-3 text-3xl">{title}</h1>
        <p className="default-mono mt-3 text-sm text-[var(--default-mist)]">{subtitle}</p>

        <div className="mt-6">
          <LoginAuthStep variant="default" {...props} />
        </div>

        <p className="default-mono mt-6 text-center text-sm text-[var(--default-mist)]">
          <Link to="/" className="hover:text-[var(--default-ember)]">
            Back to home
          </Link>
        </p>
      </section>
    </div>
  );
}
