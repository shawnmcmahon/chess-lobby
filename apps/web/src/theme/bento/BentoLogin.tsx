import { Link } from "react-router-dom";
import { loginStepSubtitle, loginStepTitle, LoginAuthStep } from "@/components/auth/LoginAuthStep";
import type { LoginControllerProps } from "@/lib/loginTypes";

export function BentoLogin(props: LoginControllerProps) {
  const heroTitle = loginStepTitle(props, {
    signIn: "Welcome back",
    signUp: "Join the lobby",
    verify: "Verify your email",
    resetRequest: "Reset password",
    resetVerify: "New password",
  });

  const heroSubtitle = loginStepSubtitle(props, {
    default: "Sign in with Google or email. Your games, rating, and correspondence queue sync across devices.",
    verify: "Check your inbox for an 8-digit code to secure your account.",
    resetRequest: "Enter your email and we will send a password reset code.",
    resetVerify: "Enter the code from your email and choose a new password.",
  });

  const formEyebrow = props.resetStep
    ? props.resetStep === "request"
      ? "Password reset"
      : "Confirm reset"
    : props.verifyStep
      ? "Verification"
      : props.flow === "signIn"
        ? "Sign in"
        : "Sign up";

  const formTitle = props.resetStep
    ? props.resetStep === "request"
      ? "Request a reset code"
      : "Set a new password"
    : props.verifyStep
      ? "Enter your code"
      : props.flow === "signIn"
        ? "Enter your account"
        : "Create an account";

  return (
    <div className="bento-grid" style={{ marginTop: 16 }}>
      <section
        className="bento-tile bento-tile--ink col-span-12 lg:col-span-5"
        style={{ padding: 36, animationDelay: "0ms", minHeight: 320 }}
      >
        <div className="bento-pill">Chess Lobby</div>
        <h1
          className="bento-tile__title"
          style={{ fontSize: "2.6rem", marginTop: 24, maxWidth: "14ch" }}
        >
          {props.resetStep || props.verifyStep ? (
            heroTitle
          ) : props.flow === "signIn" ? (
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
          {heroSubtitle}
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
        <div className="bento-tile__eyebrow">{formEyebrow}</div>
        <h2 className="bento-tile__title" style={{ fontSize: "1.6rem", marginTop: 6 }}>
          {formTitle}
        </h2>

        <div className="mt-6">
          <LoginAuthStep variant="bento" {...props} />
        </div>

        <div className="bento-divider" />

        <p className="bento-mono text-center text-[0.72rem] opacity-60">
          <Link to="/" className="hover:underline">
            ← Back to home
          </Link>
        </p>
      </section>
    </div>
  );
}
