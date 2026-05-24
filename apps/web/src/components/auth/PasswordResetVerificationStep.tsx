import type { FormEvent } from "react";
import { AUTH_THEME_STYLES } from "@/components/auth/authStyles";
import type { HeaderVariant } from "@/components/ResponsiveHeader";
import { PasswordField } from "@/components/PasswordField";

export function PasswordResetVerificationStep({
  email,
  pending,
  error,
  onSubmit,
  onCancel,
  variant,
}: {
  email: string;
  pending: boolean;
  error: string | null;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  variant: HeaderVariant;
}) {
  const styles = AUTH_THEME_STYLES[variant];

  return (
    <div className="space-y-4">
      <p className="auth-verification-copy">
        We sent an 8-digit code to <strong>{email}</strong>. Enter it below with your
        new password.
      </p>
      <form onSubmit={(e: FormEvent<HTMLFormElement>) => void onSubmit(e)} className="space-y-3">
        <input
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          placeholder="Reset code"
          className={styles.input}
        />
        <PasswordField
          flow="signUp"
          name="newPassword"
          inputClassName={styles.input}
          placeholder="New password (min 8 characters)"
        />
        <input name="email" type="hidden" value={email} readOnly />
        <input name="flow" type="hidden" value="reset-verification" readOnly />
        <button type="submit" disabled={pending} className={styles.submit}>
          {pending ? "Updating password…" : "Reset password"}
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
