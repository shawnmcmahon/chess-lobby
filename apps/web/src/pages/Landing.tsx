import { Navigate } from "react-router-dom";
import { useConvexAuth } from "convex/react";
import { useTheme } from "@/theme/themeContext";
import { BentoLanding } from "@/theme/bento/BentoLanding";
import { BrutalLanding } from "@/theme/brutal/BrutalLanding";
import { AtelierLanding } from "@/theme/atelier/AtelierLanding";
import { ThemeSettingsSection } from "@/components/ThemeSettingsSection";
import { DefaultLanding } from "@/theme/default/DefaultLanding";

export function Landing() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { theme } = useTheme();

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const themeSettings = (
    <ThemeSettingsSection className="mx-auto mt-12 max-w-2xl" />
  );

  switch (theme) {
    case "bento":
      return (
        <>
          <BentoLanding isAuthenticated={isAuthenticated} />
          {themeSettings}
        </>
      );
    case "brutal":
      return (
        <>
          <BrutalLanding isAuthenticated={isAuthenticated} />
          {themeSettings}
        </>
      );
    case "atelier":
      return (
        <>
          <AtelierLanding isAuthenticated={isAuthenticated} />
          {themeSettings}
        </>
      );
    default:
      return (
        <>
          <DefaultLanding isAuthenticated={isAuthenticated} />
          {themeSettings}
        </>
      );
  }
}
