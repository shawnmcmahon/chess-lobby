import Resend from "@auth/core/providers/resend";
import { Resend as ResendAPI } from "resend";

function generateNumericCode(length: number): string {
  const digits = new Uint8Array(length);
  crypto.getRandomValues(digits);
  return Array.from(digits, (value) => String(value % 10)).join("");
}

export const ResendOTPPasswordReset = Resend({
  id: "resend-reset",
  apiKey: process.env.AUTH_RESEND_KEY,
  async generateVerificationToken() {
    return generateNumericCode(8);
  },
  async sendVerificationRequest({ identifier: email, provider, token }) {
    const apiKey = provider.apiKey;
    if (!apiKey) {
      console.warn(
        `[auth] AUTH_RESEND_KEY is not set. Password reset code for ${email}: ${token}`,
      );
      return;
    }

    const resend = new ResendAPI(apiKey);
    const { error } = await resend.emails.send({
      from: process.env.AUTH_RESEND_FROM ?? "Chess Lobby <onboarding@resend.dev>",
      to: [email],
      subject: "Reset your Chess Lobby password",
      text: `Your password reset code is ${token}. If you did not request this, you can ignore this email.`,
    });

    if (error) {
      throw new Error("Could not send password reset email");
    }
  },
});
