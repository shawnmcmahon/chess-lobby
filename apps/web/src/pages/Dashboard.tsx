import {
  useDashboardController,
} from "@/hooks/useDashboardController";
import { useTheme } from "@/theme/themeContext";
import { BentoDashboard } from "@/theme/bento/BentoDashboard";
import { BrutalDashboard } from "@/theme/brutal/BrutalDashboard";
import { AtelierDashboard } from "@/theme/atelier/AtelierDashboard";
import { DefaultDashboard } from "@/theme/default/DefaultDashboard";

export function Dashboard() {
  const ctrl = useDashboardController();
  const { theme } = useTheme();
  switch (theme) {
    case "bento":
      return <BentoDashboard ctrl={ctrl} />;
    case "brutal":
      return <BrutalDashboard ctrl={ctrl} />;
    case "atelier":
      return <AtelierDashboard ctrl={ctrl} />;
    default:
      return <DefaultDashboard ctrl={ctrl} />;
  }
}
