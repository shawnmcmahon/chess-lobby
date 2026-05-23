import type { CSSProperties } from "react";
import type { ThemeId } from "@/theme/themes";

export type BoardSquareColors = {
  darkSquareStyle: CSSProperties;
  lightSquareStyle: CSSProperties;
};

const BOARD_THEMES: Record<ThemeId, BoardSquareColors> = {
  default: {
    lightSquareStyle: { backgroundColor: "#3d3a4a" },
    darkSquareStyle: { backgroundColor: "#1a1824" },
  },
  bento: {
    lightSquareStyle: { backgroundColor: "#e8e2d6" },
    darkSquareStyle: { backgroundColor: "#2d6a4f" },
  },
  brutal: {
    lightSquareStyle: { backgroundColor: "#fffef5" },
    darkSquareStyle: { backgroundColor: "#ff2d95" },
  },
  atelier: {
    lightSquareStyle: { backgroundColor: "#c4a574" },
    darkSquareStyle: { backgroundColor: "#1a1510" },
  },
};

export function getBoardSquareColors(theme: ThemeId): BoardSquareColors {
  return BOARD_THEMES[theme];
}
