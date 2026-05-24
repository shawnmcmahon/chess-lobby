import { useState } from "react";
import type { AuthFlow } from "@/components/auth/authStyles";

type ConfirmPasswordFieldProps = {
  flow: AuthFlow;
  inputClassName: string;
  toggleClassName?: string;
  placeholder?: string;
};

function EyeIcon({ hidden }: { hidden?: boolean }) {
  if (hidden) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M3 3l18 18M10.58 10.58A2 2 0 0 0 12 15a2 2 0 0 0 1.42-.58M9.88 5.09A10.94 10.94 0 0 1 12 5c5.52 0 10 4.5 10 7s-1.29 2.27-3.2 3.62M6.11 6.11A10.7 10.7 0 0 0 2 12c0 2.5 4.48 7 10 7 1.66 0 3.22-.36 4.58-1"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2 12s4.5-7 10-7 10 7 10 7-4.5 7-10 7-10-7-10-7Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

export function ConfirmPasswordField({
  flow,
  inputClassName,
  toggleClassName,
  placeholder = "Confirm password",
}: ConfirmPasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  if (flow !== "signUp") {
    return null;
  }

  return (
    <div className="password-field">
      <input
        name="confirmPassword"
        type={visible ? "text" : "password"}
        required
        autoComplete="new-password"
        placeholder={placeholder}
        minLength={8}
        className={`password-field__input ${inputClassName}`}
      />
      <button
        type="button"
        className={`password-field__toggle ${toggleClassName ?? ""}`.trim()}
        onClick={() => setVisible((show) => !show)}
        aria-label={visible ? "Hide confirm password" : "Show confirm password"}
        aria-pressed={visible}
      >
        <EyeIcon hidden={visible} />
      </button>
    </div>
  );
}
