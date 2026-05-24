import { Info } from "lucide-react";
import type { AuthFlow } from "@/components/auth/authStyles";
import { AUTH_THEME_STYLES } from "@/components/auth/authStyles";
import type { HeaderVariant } from "@/components/ResponsiveHeader";

const VERIFY_EMAIL_TOOLTIP =
  "If you skip email verification, you may not be able to recover your account if you forget your password. We use your email to send password reset links.";

type VerifyEmailOptionProps = {
  flow: AuthFlow;
  checked: boolean;
  onChange: (checked: boolean) => void;
  variant: HeaderVariant;
};

export function VerifyEmailOption({
  flow,
  checked,
  onChange,
  variant,
}: VerifyEmailOptionProps) {
  if (flow !== "signUp") {
    return null;
  }

  const styles = AUTH_THEME_STYLES[variant];

  return (
    <label className={styles.checkboxLabel}>
      <input
        type="checkbox"
        name="requestEmailVerification"
        value="true"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={styles.checkbox}
      />
      <span className="flex flex-1 flex-wrap items-center gap-1.5">
        Verify my email address
        <span className="auth-info-tooltip-wrap">
          <button
            type="button"
            className={styles.infoIcon}
            aria-label="Why verify your email?"
            aria-describedby="verify-email-tooltip"
          >
            <Info size={10} strokeWidth={2.5} aria-hidden />
          </button>
          <span id="verify-email-tooltip" role="tooltip" className={styles.tooltip}>
            {VERIFY_EMAIL_TOOLTIP}
          </span>
        </span>
      </span>
    </label>
  );
}

export { VERIFY_EMAIL_TOOLTIP };
