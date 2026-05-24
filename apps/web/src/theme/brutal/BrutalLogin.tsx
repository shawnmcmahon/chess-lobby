import { Link } from "react-router-dom";
import { loginStepSubtitle, loginStepTitle, LoginAuthStep } from "@/components/auth/LoginAuthStep";
import type { LoginControllerProps } from "@/lib/loginTypes";

export function BrutalLogin(props: LoginControllerProps) {
  const title = loginStepTitle(props, {
    signIn: "SIGN IN",
    signUp: "SIGN UP",
    verify: "VERIFY EMAIL",
    resetRequest: "FORGOT PASSWORD",
    resetVerify: "NEW PASSWORD",
  });

  const subtitle = loginStepSubtitle(props, {
    default: "Google or email. No velvet rope. Just chess.",
    verify: "ENTER THE 8-DIGIT CODE WE SENT TO YOUR INBOX.",
    resetRequest: "ENTER YOUR EMAIL. WE WILL SEND A RESET CODE.",
    resetVerify: "ENTER THE CODE AND YOUR NEW PASSWORD.",
  });

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
          CHESS LOBBY
        </span>
        <h1 className="brutal-display" style={{ fontSize: "clamp(2rem, 5vw, 2.8rem)" }}>
          {title}
        </h1>
        <p className="brutal-chunk mt-3" style={{ fontSize: "0.95rem", color: "var(--brutal-paper)" }}>
          {subtitle}
        </p>

        <div className="mt-8">
          <LoginAuthStep variant="brutal" {...props} />
        </div>

        <p className="brutal-chunk mt-6 text-center text-[0.85rem]">
          <Link to="/" className="brutal-display hover:underline" style={{ fontSize: "0.85rem" }}>
            ← BACK TO HOME
          </Link>
        </p>
      </section>
    </div>
  );
}
