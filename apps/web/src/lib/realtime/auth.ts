/**
 * Cognito auth placeholder — wire to @aws-amplify/auth when enabling the AWS backend.
 * Keeps the rewrite branch self-contained without replacing Convex auth on main entry.
 */

export type AuthSession = {
  accessToken: string;
  userId: string;
};

let session: AuthSession | null = null;

export function getAuthSession(): AuthSession | null {
  return session;
}

export async function getAccessToken(): Promise<string | null> {
  return session?.accessToken ?? null;
}

export function setAuthSession(next: AuthSession | null): void {
  session = next;
}

export async function signOut(): Promise<void> {
  session = null;
}
