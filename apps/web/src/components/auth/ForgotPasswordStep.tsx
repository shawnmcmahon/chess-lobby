import type { FormEvent } from "react";
import { AUTH_THEME_STYLES } from "@/components/auth/authStyles";
import type { HeaderVariant } from "@/components/ResponsiveHeader";

export function ForgotPasswordStep({
  pending,
  error,
  onSubmit,
  onCancel,
  variant,
}: {
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
        Enter the email for your account. We will send an 8-digit reset code.
      </p>
      <form onSubmit={(e: FormEvent<HTMLFormElement>) => void onSubmit(e)} className="space-y-3">
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Email"
          className={styles.input}
        />
        <input name="flow" type="hidden" value="reset" readOnly />
        <button type="submit" disabled={pending} className={styles.submit}>
          {pending ? "Sending code…" : "Send reset code"}
        </button>
      </form>
      <button type="button" onClick={onCancel} className={styles.verificationCancel}>
        Back to sign in
      </button>
      {error && (
        <div role="alert" className="auth-form-error">
          {error}
        </div>
      )}
    </div>
  );
}
