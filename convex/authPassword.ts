import { Password } from "@convex-dev/auth/providers/Password";
import type { DataModel } from "./_generated/dataModel";
import { ResendOTP } from "./ResendOTP";
import { ResendOTPPasswordReset } from "./ResendOTPPasswordReset";

export const passwordProvider = Password<DataModel>({
  verify: ResendOTP,
  reset: ResendOTPPasswordReset,
  profile(params) {
    const email = params.email as string;
    const flow = params.flow as string | undefined;
    const requestVerification = params.requestEmailVerification === "true";

    if (flow === "signUp" && !requestVerification) {
      return {
        email,
        emailVerified: email,
        emailVerificationSkipped: true,
      };
    }

    if (flow === "signUp" && requestVerification) {
      return { email, emailVerificationSkipped: false };
    }

    return { email };
  },
});
