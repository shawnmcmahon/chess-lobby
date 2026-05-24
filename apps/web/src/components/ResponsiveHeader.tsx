import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";

export type HeaderVariant = "default" | "bento" | "brutal" | "atelier";

type ResponsiveHeaderProps = {
  variant: HeaderVariant;
  logo: ReactNode;
  headerClassName?: string;
  headerStyle?: React.CSSProperties;
  innerClassName?: string;
};

function NavLinks({
  isAuthenticated,
  variant,
  onNavigate,
}: {
  isAuthenticated: boolean;
  variant: HeaderVariant;
  onNavigate?: () => void;
}) {
  if (!isAuthenticated) return null;

  const linkClass = {
    default: "default-mono default-nav-link mobile-nav__link",
    bento: "bento-mono text-[0.72rem] uppercase tracking-[0.18em] mobile-nav__link",
    brutal: "brutal-display text-[0.85rem] mobile-nav__link",
    atelier: "atelier-smallcaps mobile-nav__link",
  }[variant];

  return (
    <>
      <Link to="/dashboard" className={linkClass} onClick={onNavigate}>
        Dashboard
      </Link>
      <Link to="/profile" className={linkClass} onClick={onNavigate}>
        Profile
      </Link>
      <Link to="/leaderboard" className={linkClass} onClick={onNavigate}>
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
  onNavigate,
}: {
  isAuthenticated: boolean;
  isLoading: boolean;
  signOut: () => unknown;
  variant: HeaderVariant;
  onNavigate?: () => void;
}) {
  if (isLoading) return null;

  if (isAuthenticated) {
    const classes = {
      default: "default-btn default-btn--ghost w-full justify-center app-header__sign--desktop",
      bento: "bento-btn bento-btn--ghost w-full justify-center app-header__sign--desktop",
      brutal: "brutal-btn brutal-btn--ghost w-full justify-center app-header__sign--desktop",
      atelier: "atelier-btn atelier-btn--ghost w-full justify-center app-header__sign--desktop",
    } as const;
    return (
      <button type="button" onClick={() => void signOut()} className={classes[variant]}>
        Sign out
      </button>
    );
  }

  const classes = {
    default: "default-btn default-btn--primary w-full justify-center app-header__sign--desktop",
    bento: "bento-btn w-full justify-center app-header__sign--desktop",
    brutal: "brutal-btn w-full justify-center app-header__sign--desktop",
    atelier: "atelier-btn w-full justify-center app-header__sign--desktop",
  } as const;

  return (
    <Link to="/login" className={classes[variant]} onClick={onNavigate}>
      Sign in
    </Link>
  );
}

export function ResponsiveHeader({
  variant,
  logo,
  headerClassName,
  headerStyle,
  innerClassName,
}: ResponsiveHeaderProps) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header
      className={`app-header ${headerClassName ?? ""}`.trim()}
      style={headerStyle}
      data-theme-variant={variant}
    >
      <div
        className={`app-header__inner mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 xl:px-6 xl:py-4 ${innerClassName ?? ""}`.trim()}
      >
        <div className="min-w-0 shrink">{logo}</div>

        <nav
          className="app-header__desktop-nav items-center gap-3 xl:gap-4 2xl:gap-5"
          aria-label="Main"
        >
          <NavLinks isAuthenticated={isAuthenticated} variant={variant} />
          <SignButton
            isAuthenticated={isAuthenticated}
            isLoading={isLoading}
            signOut={signOut}
            variant={variant}
          />
        </nav>

        <div className="app-header__mobile-menu">
          <button
            type="button"
            className="mobile-nav__toggle"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-panel"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="mobile-nav__toggle-bar" />
            <span className="mobile-nav__toggle-bar" />
            <span className="mobile-nav__toggle-bar" />
          </button>
        </div>
      </div>

      {menuOpen && (
        <>
          <button
            type="button"
            className="mobile-nav__backdrop"
            aria-label="Close menu"
            onClick={closeMenu}
          />
          <div
            id="mobile-nav-panel"
            className="mobile-nav__panel"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <nav className="mobile-nav__links">
              <NavLinks
                isAuthenticated={isAuthenticated}
                variant={variant}
                onNavigate={closeMenu}
              />
            </nav>
            <div className="mobile-nav__actions">
              <SignButton
                isAuthenticated={isAuthenticated}
                isLoading={isLoading}
                signOut={signOut}
                variant={variant}
                onNavigate={closeMenu}
              />
            </div>
          </div>
        </>
      )}
    </header>
  );
}
