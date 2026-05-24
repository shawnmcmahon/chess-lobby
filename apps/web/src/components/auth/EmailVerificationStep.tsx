import type { FormEvent } from "react";
import { AUTH_THEME_STYLES } from "@/components/auth/authStyles";
import type { EmailVerificationProps } from "@/components/auth/authStyles";

export function EmailVerificationStep({
  email,
  pending,
  error,
  onSubmit,
  onCancel,
  variant,
}: EmailVerificationProps) {
  const styles = AUTH_THEME_STYLES[variant];

  return (
    <div className="space-y-4">
      <p className="auth-verification-copy">
        We sent an 8-digit code to <strong>{email}</strong>. Enter it below to
        verify your email.
      </p>
      <form onSubmit={(e: FormEvent<HTMLFormElement>) => void onSubmit(e)} className="space-y-3">
        <input
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          placeholder="Verification code"
          className={styles.input}
        />
        <input name="email" type="hidden" value={email} readOnly />
        <input name="flow" type="hidden" value="email-verification" readOnly />
        <button type="submit" disabled={pending} className={styles.submit}>
          {pending ? "Verifying…" : "Verify email"}
        </button>
      </form>
      <button type="button" onClick={onCancel} className={styles.verificationCancel}>
        Cancel and go back
      </button>
      {error && (
        <div role="alert" className="auth-form-error">
          {error}
        </div>
      )}
    </div>
  );
}
