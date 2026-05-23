/**
 * One-time setup for Convex Auth (JWT keys + SITE_URL).
 * Run: node scripts/setup-auth.mjs
 * Production: SITE_URL=https://xxx.cloudfront.net node scripts/setup-auth.mjs --prod
 */
import { execFileSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

const prod = process.argv.includes("--prod");
const siteUrl = process.env.SITE_URL ?? "http://localhost:5173";
const convexArgs = ["convex", "env", "set", "--from-file"];
if (prod) {
  convexArgs.push("--prod");
}

const keys = await generateKeyPair("RS256", { extractable: true });
const privateKey = await exportPKCS8(keys.privateKey);
const publicKey = await exportJWK(keys.publicKey);
const jwksJson = JSON.stringify({ keys: [{ use: "sig", ...publicKey }] });
const jwtPrivateKey = privateKey.trimEnd().replace(/\n/g, " ");

const envFile = join(tmpdir(), `convex-auth-${Date.now()}.env`);
// JWT_PRIVATE_KEY needs quoting (spaces). JWKS is raw JSON — do not double-stringify.
const contents = [
  `SITE_URL=${siteUrl}`,
  `JWT_PRIVATE_KEY=${JSON.stringify(jwtPrivateKey)}`,
  `JWKS=${jwksJson}`,
].join("\n");

writeFileSync(envFile, contents, "utf8");

try {
  console.log("Setting SITE_URL, JWT_PRIVATE_KEY, and JWKS on Convex...");
  execFileSync("npx", [...convexArgs, envFile, "--force"], {
    stdio: "inherit",
    shell: true,
  });
} finally {
  unlinkSync(envFile);
}

console.log("\nConvex Auth base config is set.");
console.log("Clear browser localStorage for this site if sign-in still fails, then retry.");
console.log("\nFor Google sign-in:");
console.log("  npx convex env set AUTH_GOOGLE_ID <client-id>");
console.log("  npx convex env set AUTH_GOOGLE_SECRET <client-secret>");
if (prod) {
  console.log("\nGoogle redirect URI (production):");
  console.log("  https://pastel-buffalo-515.convex.site/api/auth/callback/google");
} else {
  console.log("\nGoogle redirect URI (dev):");
  console.log("  https://pastel-grouse-840.convex.site/api/auth/callback/google");
}
