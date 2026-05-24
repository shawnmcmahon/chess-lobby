import { Link, Outlet } from "react-router-dom";
import { useConvexAuth } from "convex/react";
import { PresenceProvider } from "@/components/PresenceProvider";
import { ResponsiveHeader } from "@/components/ResponsiveHeader";
import { gameMainClassName, useIsLiveGameRoute } from "@/hooks/useIsLiveGameRoute";
import { DefaultLayout } from "@/theme/default/DefaultLayout";
import { useTheme } from "@/theme/themeContext";

export function Layout() {
  const { theme } = useTheme();
  const page =
    theme === "bento" ? (
      <BentoLayout />
    ) : theme === "brutal" ? (
      <BrutalLayout />
    ) : theme === "atelier" ? (
      <AtelierLayout />
    ) : (
      <DefaultLayout />
    );

  return page;
}

function BentoLayout() {
  const { isAuthenticated } = useConvexAuth();
  const isGameRoute = useIsLiveGameRoute();
  return (
    <PresenceProvider>
      <div
        className="bento-stage-shell min-h-screen"
        style={{ background: "var(--bento-bg)", color: "var(--bento-ink)" }}
      >
        <ResponsiveHeader
          variant="bento"
          headerStyle={{
            background: "transparent",
            borderBottom: "1px solid rgba(14,14,16,0.08)",
          }}
          logo={
            <Link
              to={isAuthenticated ? "/dashboard" : "/"}
              className="block truncate text-xl sm:text-[1.6rem]"
              style={{
                fontFamily: "'Fraunces', serif",
                fontStyle: "italic",
                fontWeight: 500,
                letterSpacing: "-0.02em",
                color: "var(--bento-ink)",
              }}
            >
              Chess Lobby
            </Link>
          }
        />
        <main
          className={gameMainClassName(
            "mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 bento-stage",
            isGameRoute,
          )}
        >
          <Outlet />
        </main>
      </div>
    </PresenceProvider>
  );
}

function BrutalLayout() {
  const { isAuthenticated } = useConvexAuth();
  const isGameRoute = useIsLiveGameRoute();
  return (
    <PresenceProvider>
      <div
        className="brutal-stage-shell min-h-screen"
        style={{ background: "var(--brutal-paper)", color: "var(--brutal-ink)" }}
      >
        <ResponsiveHeader
          variant="brutal"
          headerStyle={{
            background: "var(--brutal-ink)",
            color: "var(--brutal-yellow)",
            borderBottom: "var(--brutal-border) solid var(--brutal-ink)",
          }}
          logo={
            <Link
              to={isAuthenticated ? "/dashboard" : "/"}
              className="brutal-display block truncate text-lg sm:text-2xl"
              style={{ color: "var(--brutal-yellow)" }}
            >
              Chess Lobby
            </Link>
          }
        />
        {!isGameRoute && (
        <div className="brutal-marquee max-lg:hidden">
          <div className="brutal-marquee__track">
            {Array.from({ length: 4 }).map((_, i) => (
              <span key={i} className="brutal-marquee__item">
                <span>PAWN RIOT</span>
                <span className="brutal-marquee__dot" />
                <span>LIVE FROM THE 64</span>
                <span className="brutal-marquee__dot" />
                <span>KINGS FALL · PAWNS RISE</span>
                <span className="brutal-marquee__dot" />
                <span>NO DRAWS · NO MERCY</span>
                <span className="brutal-marquee__dot" />
              </span>
            ))}
          </div>
        </div>
        )}
        <main
          className={gameMainClassName(
            "mx-auto max-w-7xl px-4 py-5 sm:px-5 sm:py-6 brutal-stage",
            isGameRoute,
          )}
        >
          <Outlet />
        </main>
      </div>
    </PresenceProvider>
  );
}

function AtelierLayout() {
  const { isAuthenticated } = useConvexAuth();
  const isGameRoute = useIsLiveGameRoute();
  return (
    <PresenceProvider>
      <div
        className="atelier-stage-shell relative min-h-screen"
        style={{ background: "var(--atelier-obsidian)", color: "var(--atelier-parchment)" }}
      >
        <span
          aria-hidden
          className="atelier-knight hidden md:block"
          style={{ top: "20vh", right: "-4rem" }}
        >
          ♞
        </span>
        <ResponsiveHeader
          variant="atelier"
          headerClassName="sticky top-0 z-30"
          headerStyle={{
            background: "linear-gradient(180deg, rgba(11,20,36,0.95), rgba(11,20,36,0.7))",
            borderBottom: "1px solid var(--atelier-brass-dim)",
            backdropFilter: "blur(8px)",
          }}
          innerClassName="max-w-6xl"
          logo={
            <Link
              to={isAuthenticated ? "/dashboard" : "/"}
              className="block truncate text-xl sm:text-[1.65rem]"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                fontWeight: 500,
                color: "var(--atelier-parchment)",
                letterSpacing: "-0.01em",
              }}
            >
              Chess Lobby
            </Link>
          }
        />
        <main
          className={gameMainClassName(
            "mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 atelier-stage relative",
            isGameRoute,
          )}
        >
          <Outlet />
        </main>
      </div>
    </PresenceProvider>
  );
}
