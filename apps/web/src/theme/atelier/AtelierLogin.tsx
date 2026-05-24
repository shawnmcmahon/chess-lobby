import { Link } from "react-router-dom";
import { loginStepSubtitle, loginStepTitle, LoginAuthStep } from "@/components/auth/LoginAuthStep";
import type { LoginControllerProps } from "@/lib/loginTypes";

export function AtelierLogin(props: LoginControllerProps) {
  const title = loginStepTitle(props, {
    signIn: "Sign in",
    signUp: "Create account",
    verify: "Confirm your email",
    resetRequest: "Reset password",
    resetVerify: "New password",
  });

  const subtitle = loginStepSubtitle(props, {
    default: "Sign in with Google or email to play.",
    verify: "Enter the verification code we sent to your inbox.",
    resetRequest: "Enter your email and we will send a reset code.",
    resetVerify: "Enter the code from your email and choose a new password.",
  });

  return (
    <div className="mx-auto max-w-md relative">
      <span
        aria-hidden
        className="atelier-knight"
        style={{ top: "-2rem", right: "-6rem", fontSize: "18rem" }}
      >
        ♞
      </span>

      <div className="atelier-panel relative">
        <Corners />
        <div className="atelier-rule mb-6">
          <span className="atelier-smallcaps">Chess Lobby · Access</span>
        </div>
        <h1
          className="atelier-display text-center"
          style={{ fontSize: "2.4rem", fontStyle: "italic", lineHeight: 1.05 }}
        >
          {title}
        </h1>
        <p
          className="mt-3 text-center"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            color: "var(--atelier-parchment-soft)",
          }}
        >
          {subtitle}
        </p>

        <div className="mt-8">
          <LoginAuthStep variant="atelier" {...props} />

          <p className="mt-6 text-center">
            <Link
              to="/"
              className="atelier-smallcaps"
              style={{ color: "var(--atelier-brass-dim)" }}
            >
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Corners() {
  return (
    <>
      <span className="atelier-panel__corner atelier-panel__corner--tl" />
      <span className="atelier-panel__corner atelier-panel__corner--tr" />
      <span className="atelier-panel__corner atelier-panel__corner--bl" />
      <span className="atelier-panel__corner atelier-panel__corner--br" />
    </>
  );
}
