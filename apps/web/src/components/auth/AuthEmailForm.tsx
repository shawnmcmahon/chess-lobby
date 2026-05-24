import { AuthFlowTabs } from "@/components/auth/AuthFlowTabs";
import { ConfirmPasswordField } from "@/components/auth/ConfirmPasswordField";
import { VerifyEmailOption } from "@/components/auth/VerifyEmailOption";
import { PasswordField } from "@/components/PasswordField";
import { AUTH_THEME_STYLES, type LoginFormProps } from "@/components/auth/authStyles";

export function AuthEmailForm({
  flow,
  setFlow,
  verifyEmail,
  setVerifyEmail,
  error,
  pending,
  isLoading,
  onEmailSubmit,
  onGoogleSignIn,
  onForgotPassword,
  variant,
}: LoginFormProps) {
  const styles = AUTH_THEME_STYLES[variant];

  return (
    <>
      <AuthFlowTabs flow={flow} setFlow={setFlow} variant={variant} />

      <button
        type="button"
        disabled={pending}
        onClick={() => void onGoogleSignIn()}
        className={`${styles.google} mt-5`}
        style={variant === "bento" ? { display: "flex" } : undefined}
      >
        Continue with Google
      </button>

      <div className={styles.divider}>or</div>

      <form onSubmit={(e) => void onEmailSubmit(e)} className="space-y-3">
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Email"
          className={styles.input}
        />
        <PasswordField flow={flow} inputClassName={styles.input} />
        {flow === "signIn" && onForgotPassword && (
          <div className="text-right">
            <button
              type="button"
              onClick={onForgotPassword}
              className="auth-forgot-password"
            >
              Forgot password?
            </button>
          </div>
        )}
        <ConfirmPasswordField flow={flow} inputClassName={styles.input} />
        <VerifyEmailOption
          flow={flow}
          checked={verifyEmail}
          onChange={setVerifyEmail}
          variant={variant}
        />
        <button type="submit" disabled={pending || isLoading} className={styles.submit}>
          {pending || isLoading
            ? flow === "signIn"
              ? "Signing in…"
              : "Creating account…"
            : flow === "signIn"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>

      {error && (
        <div role="alert" className="auth-form-error mt-4">
          {error}
        </div>
      )}
    </>
  );
}
