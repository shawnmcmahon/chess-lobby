import Resend from "@auth/core/providers/resend";
import { Resend as ResendAPI } from "resend";

function generateNumericCode(length: number): string {
  const digits = new Uint8Array(length);
  crypto.getRandomValues(digits);
  return Array.from(digits, (value) => String(value % 10)).join("");
}

export const ResendOTP = Resend({
  id: "resend-otp",
  apiKey: process.env.AUTH_RESEND_KEY,
  async generateVerificationToken() {
    return generateNumericCode(8);
  },
  async sendVerificationRequest({ identifier: email, provider, token }) {
    const apiKey = provider.apiKey;
    if (!apiKey) {
      console.warn(
        `[auth] AUTH_RESEND_KEY is not set. Verification code for ${email}: ${token}`,
      );
      return;
    }

    const resend = new ResendAPI(apiKey);
    const { error } = await resend.emails.send({
      from: process.env.AUTH_RESEND_FROM ?? "Chess Lobby <onboarding@resend.dev>",
      to: [email],
      subject: "Verify your Chess Lobby email",
      text: `Your verification code is ${token}`,
    });

    if (error) {
      throw new Error("Could not send verification email");
    }
  },
});
