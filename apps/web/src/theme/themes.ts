export const THEMES = [
  {
    id: "default",
    label: "Default",
    tagline: "Midnight amber — the original",
  },
  {
    id: "bento",
    label: "Atelier Grid",
    tagline: "Bento — light editorial",
  },
  {
    id: "brutal",
    label: "Pawn Riot",
    tagline: "Neo-brutalist chess zine",
  },
  {
    id: "atelier",
    label: "Obsidian Atelier",
    tagline: "Couture chess house",
  },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export const DEFAULT_THEME: ThemeId = "default";

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return THEMES.some((t) => t.id === value);
}
