import { ConvexReactClient } from "convex/react";

const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;

if (!convexUrl) {
  console.warn("VITE_CONVEX_URL is not set. Run `npx convex dev` and copy .env.local values.");
}

export const convex = new ConvexReactClient(convexUrl ?? "https://placeholder.convex.cloud");
