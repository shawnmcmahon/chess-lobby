import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";
import { passwordProvider } from "./authPassword";

const googleId = process.env.AUTH_GOOGLE_ID;
const googleSecret = process.env.AUTH_GOOGLE_SECRET;

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    ...(googleId && googleSecret
      ? [
          Google({
            clientId: googleId,
            clientSecret: googleSecret,
          }),
        ]
      : []),
    passwordProvider,
  ],
});
