import { Navigate } from "react-router-dom";
import { useConvexAuth } from "convex/react";
import { useTheme } from "@/theme/themeContext";
import { BentoLanding } from "@/theme/bento/BentoLanding";
import { BrutalLanding } from "@/theme/brutal/BrutalLanding";
import { AtelierLanding } from "@/theme/atelier/AtelierLanding";
import { DefaultLanding } from "@/theme/default/DefaultLanding";

export function Landing() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { theme } = useTheme();

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  switch (theme) {
    case "bento":
      return <BentoLanding isAuthenticated={isAuthenticated} />;
    case "brutal":
      return <BrutalLanding isAuthenticated={isAuthenticated} />;
    case "atelier":
      return <AtelierLanding isAuthenticated={isAuthenticated} />;
    default:
      return <DefaultLanding isAuthenticated={isAuthenticated} />;
  }
}
