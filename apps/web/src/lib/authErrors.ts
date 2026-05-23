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
    return "Incorrect password. Try again or use Sign up if you have not created an account yet.";
  }

  if (raw.includes("already exists")) {
    return "An account with this email already exists. Use Sign in instead.";
  }

  return flow === "signIn"
    ? "Sign in failed. Check your email and password, or create an account below."
    : "Could not create account. If you already signed up, use Sign in instead.";
}
