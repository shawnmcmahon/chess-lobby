export type TurnIndicatorCopy = {
  primary: string;
  secondary: string;
  isMyTurn: boolean;
  moverColor: "white" | "black";
};

export function getTurnIndicatorCopy(opts: {
  currentTurn: "white" | "black";
  myColor: "white" | "black" | null;
  spectate: boolean;
  whiteName: string;
  blackName: string;
  status: string;
}): TurnIndicatorCopy | null {
  if (opts.status !== "active") {
    return null;
  }

  const moverColor = opts.currentTurn;
  const moverName = moverColor === "white" ? opts.whiteName : opts.blackName;
  const colorLabel = moverColor === "white" ? "White" : "Black";

  if (opts.spectate || opts.myColor === null) {
    return {
      primary: `${moverName} to move`,
      secondary: `${colorLabel}'s turn`,
      isMyTurn: false,
      moverColor,
    };
  }

  if (opts.myColor === moverColor) {
    return {
      primary: "Your move",
      secondary: `You are ${colorLabel.toLowerCase()}`,
      isMyTurn: true,
      moverColor,
    };
  }

  return {
    primary: `${moverName} to move`,
    secondary: "Waiting for opponent",
    isMyTurn: false,
    moverColor,
  };
}
