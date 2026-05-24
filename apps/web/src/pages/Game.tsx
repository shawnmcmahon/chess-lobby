import { useGameController } from "@/hooks/useGameController";
import { useGameAbortedAlert } from "@/hooks/useGameAbortedAlert";
import { useTheme } from "@/theme/themeContext";import { BentoGame } from "@/theme/bento/BentoGame";
import { BrutalGame } from "@/theme/brutal/BrutalGame";
import { AtelierGame } from "@/theme/atelier/AtelierGame";
import { DefaultGame } from "@/theme/default/DefaultGame";

export function Game() {
  const ctrl = useGameController();
  useGameAbortedAlert(ctrl.game?.status);
  const { theme } = useTheme();
  switch (theme) {
    case "bento":
      return <BentoGame ctrl={ctrl} />;
    case "brutal":
      return <BrutalGame ctrl={ctrl} />;
    case "atelier":
      return <AtelierGame ctrl={ctrl} />;
    default:
      return <DefaultGame ctrl={ctrl} />;
  }
}
