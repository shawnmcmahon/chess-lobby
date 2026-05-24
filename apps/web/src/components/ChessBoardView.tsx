import { useEffect, useRef, useState } from "react";
import { Chessboard, type Arrow } from "react-chessboard";
import { getBoardSquareColors } from "@/lib/boardTheme";
import { useTheme } from "@/theme/themeContext";

export type ChessBoardViewProps = {
  fen: string;
  orientation?: "white" | "black";
  allowDragging?: boolean;
  onPieceDrop?: (args: {
    piece: unknown;
    sourceSquare: string;
    targetSquare: string | null;
  }) => boolean;
  customArrows?: Arrow[];
  onArrowsChange?: (arrows: Arrow[]) => void;
  readOnly?: boolean;
  allowDrawingArrows?: boolean;
};

export function ChessBoardView({
  fen,
  orientation = "white",
  allowDragging = false,
  onPieceDrop,
  customArrows,
  onArrowsChange,
  readOnly = false,
  allowDrawingArrows = true,
}: ChessBoardViewProps) {
  const { theme } = useTheme();
  const boardRef = useRef<HTMLDivElement>(null);
  const squareColors = getBoardSquareColors(theme);
  const [internalArrows, setInternalArrows] = useState<Arrow[]>([]);
  const arrows = customArrows ?? internalArrows;
  const setArrows = onArrowsChange ?? setInternalArrows;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setArrows([]);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setArrows]);

  useEffect(() => {
    const container = boardRef.current;
    if (!container) return;

    for (const square of container.querySelectorAll("[data-square]")) {
      const id = square.getAttribute("data-square");
      if (!id) continue;

      square.setAttribute("role", "button");
      square.setAttribute("aria-label", `Square ${id.toUpperCase()}`);
    }
  }, [fen, orientation, theme]);

  return (
    <div
      ref={boardRef}
      className="mx-auto max-w-[480px]"
      role="region"
      aria-label="Chessboard"
    >
      <Chessboard
        options={{
          position: fen,
          boardOrientation: orientation,
          allowDragging: readOnly ? false : allowDragging,
          allowDrawingArrows,
          arrows,
          darkSquareStyle: squareColors.darkSquareStyle,
          lightSquareStyle: squareColors.lightSquareStyle,
          onArrowsChange: ({ arrows: next }) => setArrows(next),
          onPieceDrop: onPieceDrop
            ? ({ piece, sourceSquare, targetSquare }) =>
                onPieceDrop({ piece, sourceSquare, targetSquare })
            : undefined,
        }}
      />
    </div>
  );
}
