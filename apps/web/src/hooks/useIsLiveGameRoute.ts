import { useLocation } from "react-router-dom";

/** True on live game pages (not join/review). */
export function useIsLiveGameRoute(): boolean {
  const { pathname } = useLocation();
  return /^\/game\/[^/]+$/.test(pathname);
}

/** Tighter top padding on game routes for mobile/tablet. */
export function gameMainClassName(base: string, isGameRoute: boolean): string {
  if (!isGameRoute) {
    return base;
  }
  return base
    .replace(/\bpy-\d+\b/g, "")
    .replace(/\bsm:py-\d+\b/g, "")
    .replace(/\bpy-\[[^\]]+\]\b/g, "")
    .trim()
    .concat(" py-2 sm:py-3 lg:py-8");
}
