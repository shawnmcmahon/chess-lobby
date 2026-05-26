import { createRemoteJWKSet, jwtVerify } from "jose";
import type { UserId } from "../types/domain.js";

export type AuthClaims = {
  userId: UserId;
  email?: string;
  name?: string;
};

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

function getJwks(): ReturnType<typeof createRemoteJWKSet> {
  if (!jwks) {
    const region = process.env.AWS_REGION ?? "us-east-1";
    const userPoolId = process.env.COGNITO_USER_POOL_ID;
    if (!userPoolId) {
      throw new Error("COGNITO_USER_POOL_ID is not configured");
    }
    const url = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
    jwks = createRemoteJWKSet(new URL(url));
  }
  return jwks;
}

export async function verifyAccessToken(token: string): Promise<AuthClaims | null> {
  try {
    const region = process.env.AWS_REGION ?? "us-east-1";
    const userPoolId = process.env.COGNITO_USER_POOL_ID;
    const clientId = process.env.COGNITO_CLIENT_ID;
    if (!userPoolId || !clientId) {
      return null;
    }

    const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
    const { payload } = await jwtVerify(token, getJwks(), {
      issuer,
      audience: clientId,
    });

    const sub = payload.sub;
    if (!sub || typeof sub !== "string") {
      return null;
    }

    return {
      userId: sub,
      email: typeof payload.email === "string" ? payload.email : undefined,
      name: typeof payload.name === "string" ? payload.name : undefined,
    };
  } catch {
    return null;
  }
}

export function extractBearerToken(headerValue: string | undefined): string | null {
  if (!headerValue?.startsWith("Bearer ")) {
    return null;
  }
  return headerValue.slice("Bearer ".length).trim() || null;
}
