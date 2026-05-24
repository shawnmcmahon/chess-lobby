import { lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";
import { useConvexAuth } from "convex/react";
import { useTheme } from "@/theme/themeContext";
import { ThemeSettingsSection } from "@/components/ThemeSettingsSection";

const BentoLanding = lazy(() =>
  import("@/theme/bento/BentoLanding").then((m) => ({ default: m.BentoLanding })),
);
const BrutalLanding = lazy(() =>
  import("@/theme/brutal/BrutalLanding").then((m) => ({ default: m.BrutalLanding })),
);
const AtelierLanding = lazy(() =>
  import("@/theme/atelier/AtelierLanding").then((m) => ({ default: m.AtelierLanding })),
);
const DefaultLanding = lazy(() =>
  import("@/theme/default/DefaultLanding").then((m) => ({ default: m.DefaultLanding })),
);

function LandingFallback() {
  return <div className="min-h-[50vh]" aria-hidden />;
}

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
        <Suspense fallback={<LandingFallback />}>
          <BentoLanding isAuthenticated={isAuthenticated} />
          {themeSettings}
        </Suspense>
      );
    case "brutal":
      return (
        <Suspense fallback={<LandingFallback />}>
          <BrutalLanding isAuthenticated={isAuthenticated} />
          {themeSettings}
        </Suspense>
      );
    case "atelier":
      return (
        <Suspense fallback={<LandingFallback />}>
          <AtelierLanding isAuthenticated={isAuthenticated} />
          {themeSettings}
        </Suspense>
      );
    default:
      return (
        <Suspense fallback={<LandingFallback />}>
          <DefaultLanding isAuthenticated={isAuthenticated} />
          {themeSettings}
        </Suspense>
      );
  }
}
