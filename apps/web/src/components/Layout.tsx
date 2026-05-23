import { Link, Outlet } from "react-router-dom";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { PresenceProvider } from "@/components/PresenceProvider";
import { ThemeSwitcher } from "@/theme/ThemeSwitcher";
import { useTheme } from "@/theme/themeContext";

export function Layout() {
  const { theme } = useTheme();
  switch (theme) {
    case "bento":
      return <BentoLayout />;
    case "brutal":
      return <BrutalLayout />;
    case "atelier":
      return <AtelierLayout />;
    default:
      return <DefaultLayout />;
  }
}

function NavLinks({
  isAuthenticated,
  className,
  hoverClass,
}: {
  isAuthenticated: boolean;
  className?: string;
  hoverClass?: string;
}) {
  if (!isAuthenticated) return null;
  const cls = `${className ?? ""} ${hoverClass ?? ""}`.trim();
  return (
    <>
      <Link to="/dashboard" className={cls}>
        Dashboard
      </Link>
      <Link to="/profile" className={cls}>
        Profile
      </Link>
      <Link to="/leaderboard" className={cls}>
        Leaderboard
      </Link>
    </>
  );
}

function SignButton({
  isAuthenticated,
  isLoading,
  signOut,
  variant,
}: {
  isAuthenticated: boolean;
  isLoading: boolean;
  signOut: () => unknown;
  variant: "default" | "bento" | "brutal" | "atelier";
}) {
  if (isLoading) return null;
  if (isAuthenticated) {
    const classes = {
      default: "rounded-md border border-stone-700 px-3 py-1 hover:border-amber-600",
      bento: "bento-btn bento-btn--ghost",
      brutal: "brutal-btn brutal-btn--ghost",
      atelier: "atelier-btn atelier-btn--ghost",
    } as const;
    return (
      <button type="button" onClick={() => void signOut()} className={classes[variant]}>
        Sign out
      </button>
    );
  }
  const classes = {
    default: "rounded-md bg-amber-600 px-3 py-1 font-medium text-stone-950 hover:bg-amber-500",
    bento: "bento-btn",
    brutal: "brutal-btn",
    atelier: "atelier-btn",
  } as const;
  return (
    <Link to="/login" className={classes[variant]}>
      Sign in
    </Link>
  );
}

function DefaultLayout() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  return (
    <PresenceProvider>
      <div className="min-h-screen bg-[#1a1a1f] text-stone-100">
        <header className="border-b border-stone-800 bg-[#121218]">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link
              to={isAuthenticated ? "/dashboard" : "/"}
              className="text-lg font-semibold tracking-tight text-amber-400"
            >
              Chess Lobby
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <NavLinks
                isAuthenticated={isAuthenticated}
                className="hover:text-amber-300"
              />
              <SignButton
                isAuthenticated={isAuthenticated}
                isLoading={isLoading}
                signOut={signOut}
                variant="default"
              />
              <ThemeSwitcher />
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">
          <Outlet />
        </main>
      </div>
    </PresenceProvider>
  );
}

function BentoLayout() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  return (
    <PresenceProvider>
      <div
        className="min-h-screen"
        style={{ background: "var(--bento-bg)", color: "var(--bento-ink)" }}
      >
        <header
          style={{
            background: "transparent",
            borderBottom: "1px solid rgba(14,14,16,0.08)",
          }}
        >
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
            <Link
              to={isAuthenticated ? "/dashboard" : "/"}
              style={{
                fontFamily: "'Fraunces', serif",
                fontStyle: "italic",
                fontWeight: 500,
                fontSize: "1.6rem",
                letterSpacing: "-0.02em",
                color: "var(--bento-ink)",
              }}
            >
              chess<span style={{ color: "var(--bento-clay)" }}>·</span>lobby
            </Link>
            <nav className="flex items-center gap-5 text-sm">
              <NavLinks
                isAuthenticated={isAuthenticated}
                className="bento-mono text-[0.72rem] uppercase tracking-[0.18em]"
              />
              <SignButton
                isAuthenticated={isAuthenticated}
                isLoading={isLoading}
                signOut={signOut}
                variant="bento"
              />
              <ThemeSwitcher />
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-6 py-8 bento-stage">
          <Outlet />
        </main>
      </div>
    </PresenceProvider>
  );
}

function BrutalLayout() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  return (
    <PresenceProvider>
      <div
        className="min-h-screen"
        style={{ background: "var(--brutal-paper)", color: "var(--brutal-ink)" }}
      >
        <header
          style={{
            background: "var(--brutal-ink)",
            color: "var(--brutal-yellow)",
            borderBottom: "var(--brutal-border) solid var(--brutal-ink)",
          }}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
            <Link
              to={isAuthenticated ? "/dashboard" : "/"}
              className="brutal-display"
              style={{ color: "var(--brutal-yellow)", fontSize: "1.5rem" }}
            >
              <span style={{ color: "var(--brutal-magenta)" }}>♟</span>{" "}
              CHESS//LOBBY
            </Link>
            <nav className="flex items-center gap-3">
              <NavLinks
                isAuthenticated={isAuthenticated}
                className="brutal-display text-[0.85rem]"
              />
              <SignButton
                isAuthenticated={isAuthenticated}
                isLoading={isLoading}
                signOut={signOut}
                variant="brutal"
              />
              <ThemeSwitcher />
            </nav>
          </div>
        </header>
        <div className="brutal-marquee">
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
        <main className="mx-auto max-w-7xl px-5 py-6 brutal-stage">
          <Outlet />
        </main>
      </div>
    </PresenceProvider>
  );
}

function AtelierLayout() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  return (
    <PresenceProvider>
      <div
        className="min-h-screen relative"
        style={{ background: "var(--atelier-obsidian)", color: "var(--atelier-parchment)" }}
      >
        <span
          aria-hidden
          className="atelier-knight"
          style={{ top: "20vh", right: "-4rem" }}
        >
          ♞
        </span>
        <header
          style={{
            background: "linear-gradient(180deg, rgba(11,20,36,0.95), rgba(11,20,36,0.7))",
            borderBottom: "1px solid var(--atelier-brass-dim)",
            backdropFilter: "blur(8px)",
            position: "sticky",
            top: 0,
            zIndex: 30,
          }}
        >
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link
              to={isAuthenticated ? "/dashboard" : "/"}
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                fontWeight: 500,
                fontSize: "1.65rem",
                color: "var(--atelier-parchment)",
                letterSpacing: "-0.01em",
              }}
            >
              Maison{" "}
              <span style={{ color: "var(--atelier-brass)" }}>Échecs</span>
            </Link>
            <nav className="flex items-center gap-6">
              <NavLinks
                isAuthenticated={isAuthenticated}
                className="atelier-smallcaps"
              />
              <SignButton
                isAuthenticated={isAuthenticated}
                isLoading={isLoading}
                signOut={signOut}
                variant="atelier"
              />
              <ThemeSwitcher />
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-10 atelier-stage relative">
          <Outlet />
        </main>
      </div>
    </PresenceProvider>
  );
}
