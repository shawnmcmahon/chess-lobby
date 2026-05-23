import { useEffect, useState } from "react";
import { Chessboard, type Arrow } from "react-chessboard";

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
};

export function ChessBoardView({
  fen,
  orientation = "white",
  allowDragging = false,
  onPieceDrop,
  customArrows,
  onArrowsChange,
  readOnly = false,
}: ChessBoardViewProps) {
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

  return (
    <div className="mx-auto max-w-[480px]">
      <Chessboard
        options={{
          position: fen,
          boardOrientation: orientation,
          allowDragging: readOnly ? false : allowDragging,
          allowDrawingArrows: !readOnly,
          arrows,
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
