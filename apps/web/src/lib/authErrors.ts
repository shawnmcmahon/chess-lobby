export function getAuthErrorMessage(
  err: unknown,
  flow: "signIn" | "signUp",
): string {
  const raw = err instanceof Error ? err.message : String(err);

  if (
    raw.includes("InvalidAccountId") ||
    raw.includes("AccountNotFound") ||
    raw.includes("Could not find account") ||
    raw.includes("No account")
  ) {
    return flow === "signIn"
      ? 'No account found for this email. Use "Need an account? Sign up" below to create one.'
      : "Could not create account. Try a different email.";
  }

  if (
    raw.includes("InvalidSecret") ||
    raw.includes("Invalid password") ||
    raw.includes("incorrect password")
  ) {
    return "Incorrect password. Try again or use Forgot password? to reset it.";
  }

  if (
    raw.includes("Could not send password reset") ||
    raw.includes("Could not send")
  ) {
    return "Could not send reset email. Try again in a moment.";
  }

  if (raw.includes("Invalid code") || raw.includes("Invalid verification")) {
    return "Invalid reset code. Check the code in your email and try again.";
  }

  if (raw.includes("already exists")) {
    return "An account with this email already exists. Use Sign in instead.";
  }

  return flow === "signIn"
    ? "Sign in failed. Check your email and password, or create an account below."
    : "Could not create account. If you already signed up, use Sign in instead.";
}
