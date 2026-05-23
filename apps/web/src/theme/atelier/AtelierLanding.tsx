import { Link } from "react-router-dom";
import { LandingHeroBoard } from "@/components/landing/LandingHeroBoard";
import { LandingLiveStats } from "@/components/landing/LandingLiveStats";

export function AtelierLanding({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <div className="relative space-y-12" style={{ minHeight: "calc(100vh - 200px)" }}>
      <section className="grid items-center gap-10 lg:grid-cols-2">
        <div className="text-center lg:text-left max-w-xl mx-auto lg:mx-0 pt-4 relative">
          <div className="atelier-rule mb-8">
            <span className="atelier-smallcaps">Maison Échecs · Anno MMXXVI</span>
          </div>
          <p
            className="atelier-display"
            style={{
              fontSize: "1.4rem",
              fontStyle: "italic",
              color: "var(--atelier-brass)",
              marginBottom: 12,
            }}
          >
            — a couture house for the sixty-four squares —
          </p>
          <h1
            className="atelier-display"
            style={{
              fontSize: "clamp(3rem, 7vw, 5.5rem)",
              lineHeight: 0.96,
              letterSpacing: "-0.02em",
              fontWeight: 400,
              fontStyle: "normal",
            }}
          >
            The slow art of{" "}
            <span style={{ fontStyle: "italic", color: "var(--atelier-brass)" }}>
              checkmate.
            </span>
          </h1>
          <p
            className="mt-8"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "1.2rem",
              lineHeight: 1.55,
              color: "var(--atelier-parchment-soft)",
            }}
          >
            A chess lobby crafted like an heirloom — brass dials, parchment panels,
            and eleven cadences from bullet to correspondence.
          </p>
          <LandingLiveStats
            render={({ inPlayCount, loading }) => (
              <p className="atelier-smallcaps mt-6" style={{ color: "var(--atelier-brass)" }}>
                {loading ? "Salon activity — …" : `${inPlayCount ?? 0} games in progress`}
              </p>
            )}
          />
          <div className="mt-10 flex items-center justify-center lg:justify-start gap-4 flex-wrap">
            <Link
              to={isAuthenticated ? "/dashboard" : "/login"}
              className="atelier-btn"
              style={{ padding: "16px 32px", fontSize: "0.78rem" }}
            >
              {isAuthenticated ? "Enter the salon" : "Procure access"}
            </Link>
            <a href="#collection" className="atelier-btn atelier-btn--ghost" style={{ padding: "16px 32px", fontSize: "0.78rem" }}>
              View the collection
            </a>
          </div>
          <div className="mt-10 flex items-center justify-center lg:justify-start">
            <span className="atelier-seal">★</span>
          </div>
        </div>
        <div className="atelier-hero-frame relative">
          <div className="atelier-hero-frame__photo">
            <img src="/landing/atelier-salon.jpg" alt="" loading="lazy" className="atelier-hero-frame__img" />
          </div>
          <div className="atelier-hero-frame__board">
            <LandingHeroBoard className="max-w-[260px] mx-auto" intervalMs={2800} />
          </div>
        </div>
      </section>

      <section id="collection" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          number="I."
          title="Pairing"
          tagline="Calibre 1 · 0 to 30 · 20"
          body="Eleven cadences, machine-matched by Elo. The bell rings, the silence begins."
        />
        <Card
          number="II."
          title="Salon Invitations"
          tagline="Calibre Privé"
          body="A single link, sealed in wax. Your guest enters without ceremony."
          accent
        />
        <Card
          number="III."
          title="Correspondence"
          tagline="Calibre Lent"
          body="Days per turn. The way our grandfathers played — by post, by patience."
        />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6 items-stretch">
        <div className="atelier-panel">
          <Corners />
          <div className="atelier-smallcaps" style={{ color: "var(--atelier-brass)" }}>
            Atelier Note
          </div>
          <h2
            className="atelier-display mt-2"
            style={{ fontSize: "2.4rem", lineHeight: 1.05 }}
          >
            The board, <span style={{ fontStyle: "italic" }}>polished.</span>
          </h2>
          <p
            className="mt-4"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "1.05rem",
              lineHeight: 1.55,
              color: "var(--atelier-parchment-soft)",
            }}
          >
            Every match begins with a brass dial and ends with a wax seal.
            Resignations are noted in the ledger. Draws are accepted with a
            small bow. Post-game review awaits in the archive.
          </p>
          <div className="atelier-rule mt-6">
            <span className="atelier-smallcaps">— signed —</span>
          </div>
        </div>
        <div className="atelier-panel atelier-panel--brass">
          <div
            className="atelier-smallcaps"
            style={{ color: "var(--atelier-obsidian)", opacity: 0.7 }}
          >
            Stockfish sparring
          </div>
          <h3
            className="atelier-display mt-2"
            style={{ fontSize: "2rem", color: "var(--atelier-obsidian)", lineHeight: 1 }}
          >
            Twenty levels.<br />Honest evaluation.
          </h3>
          <p
            className="mt-3"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "1rem",
              lineHeight: 1.5,
              color: "var(--atelier-obsidian)",
              opacity: 0.85,
            }}
          >
            The machine speaks only when asked, and never flatters. After the
            game, every move is reviewed — by the engine and, occasionally, by
            the editor.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <span className="atelier-seal" style={{ width: 48, height: 48, fontSize: "1rem" }}>
              ✦
            </span>
            <span
              className="atelier-smallcaps"
              style={{ color: "var(--atelier-obsidian)" }}
            >
              Maison hallmark
            </span>
          </div>
        </div>
      </section>

      <section className="atelier-panel text-center" style={{ padding: "40px 28px" }}>
        <div className="atelier-rule mb-6">
          <span className="atelier-smallcaps">Finale</span>
        </div>
        <h2 className="atelier-display" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
          The salon awaits <span style={{ fontStyle: "italic", color: "var(--atelier-brass)" }}>your debut.</span>
        </h2>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            to={isAuthenticated ? "/dashboard" : "/login"}
            className="atelier-btn atelier-btn--oxblood"
            style={{ padding: "14px 28px" }}
          >
            {isAuthenticated ? "Return to the floor" : "Request admission"}
          </Link>
          <Link to="/leaderboard" className="atelier-btn atelier-btn--ghost" style={{ padding: "14px 28px" }}>
            Registre des maîtres
          </Link>
        </div>
      </section>
    </div>
  );
}

function Card({
  number,
  title,
  tagline,
  body,
  accent,
}: {
  number: string;
  title: string;
  tagline: string;
  body: string;
  accent?: boolean;
}) {
  return (
    <article className={`atelier-panel${accent ? " atelier-panel--parchment" : ""}`}>
      <Corners />
      <div className="flex items-baseline justify-between">
        <span
          className="atelier-display"
          style={{
            fontSize: "1.4rem",
            color: accent ? "var(--atelier-oxblood)" : "var(--atelier-brass)",
            fontStyle: "italic",
          }}
        >
          {number}
        </span>
        <span
          className="atelier-smallcaps"
          style={{ color: accent ? "var(--atelier-oxblood)" : "var(--atelier-brass)" }}
        >
          {tagline}
        </span>
      </div>
      <h3
        className="atelier-display mt-4"
        style={{ fontSize: "2rem", lineHeight: 1, fontWeight: 500, fontStyle: "normal" }}
      >
        {title}
      </h3>
      <p
        className="mt-3"
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "1.05rem",
          lineHeight: 1.5,
          color: accent
            ? "var(--atelier-obsidian)"
            : "var(--atelier-parchment-soft)",
        }}
      >
        {body}
      </p>
    </article>
  );
}

function Corners() {
  return (
    <>
      <span className="atelier-panel__corner atelier-panel__corner--tl" />
      <span className="atelier-panel__corner atelier-panel__corner--tr" />
      <span className="atelier-panel__corner atelier-panel__corner--bl" />
      <span className="atelier-panel__corner atelier-panel__corner--br" />
    </>
  );
}
