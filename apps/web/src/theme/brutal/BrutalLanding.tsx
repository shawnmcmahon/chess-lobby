import { Link } from "react-router-dom";
import { LandingHeroBoard } from "@/components/landing/LandingHeroBoard";
import { LandingLiveStats } from "@/components/landing/LandingLiveStats";

export function BrutalLanding({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <div className="space-y-8">
      <section
        className="brutal-card"
        style={{
          padding: 0,
          background: "var(--brutal-paper)",
          boxShadow: "12px 12px 0 var(--brutal-ink)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <span
          className="brutal-sticker brutal-sticker--magenta"
          style={{ top: -22, right: 24, zIndex: 2 }}
          data-tilt="right"
        >
          ISSUE 064 · 2026
        </span>
        <span
          className="brutal-sticker brutal-sticker--blue"
          style={{ top: 80, left: -28, zIndex: 2 }}
          data-tilt="left"
        >
          ★ NEW ★
        </span>
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr]">
          <div className="p-8 md:p-12 relative">
            <div className="brutal-tape" style={{ marginBottom: 24 }}>
              ★ A ZINE FOR PIECES THAT BITE BACK
            </div>
            <h1
              className="brutal-display"
              style={{ fontSize: "clamp(3rem, 7vw, 6.5rem)", lineHeight: 0.88 }}
            >
              KINGS<br />
              FALL.<br />
              <span style={{ color: "var(--brutal-magenta)" }}>PAWNS</span>
              <br />
              <span style={{ background: "var(--brutal-yellow)", padding: "0 0.2em" }}>
                RIOT.
              </span>
            </h1>
            <p
              className="mt-8 brutal-chunk"
              style={{ fontSize: "1.1rem", maxWidth: "36ch", lineHeight: 1.45 }}
            >
              The chess lobby for people who think bullet is a personality trait.
              Pair up. Trash-talk. Resign with dignity (or don&apos;t).
            </p>
            <LandingLiveStats
              render={({ inPlayCount, waitingCount, loading }) => (
                <p className="mt-4 brutal-display text-[0.85rem]" style={{ color: "var(--brutal-magenta)" }}>
                  {loading
                    ? "SCANNING THE FLOOR…"
                    : `${inPlayCount ?? 0} LIVE · ${waitingCount ?? 0} WAITING`}
                </p>
              )}
            />
            <div className="mt-8 flex flex-wrap gap-4 relative">
              <Link to={isAuthenticated ? "/dashboard" : "/login"} className="brutal-btn brutal-btn--xl brutal-btn--ink">
                ▶ ENTER THE LOBBY
              </Link>
              <a href="#features" className="brutal-btn brutal-btn--xl">
                ↓ THE GOODS
              </a>
            </div>
          </div>
          <aside
            className="relative p-8 md:p-12"
            style={{
              background: "var(--brutal-ink)",
              color: "var(--brutal-yellow)",
              borderLeft: "4px solid var(--brutal-ink)",
            }}
          >
            <div
              className="brutal-photo-cutout absolute inset-0 opacity-20"
              style={{
                backgroundImage: "url(/landing/brutal-tournament.jpg)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                mixBlendMode: "luminosity",
              }}
              aria-hidden
            />
            <div className="relative">
              <div className="brutal-display" style={{ fontSize: "1rem" }}>
                ON THE TABLE:
              </div>
              <ul className="mt-6 space-y-5 brutal-chunk" style={{ fontSize: "1.2rem" }}>
                <li className="flex justify-between items-baseline">
                  <span>1·0 bullet</span>
                  <span style={{ color: "var(--brutal-magenta)" }}>★</span>
                </li>
                <li className="flex justify-between items-baseline">
                  <span>3·0 blitz</span>
                  <span style={{ color: "var(--brutal-magenta)" }}>★★</span>
                </li>
                <li className="flex justify-between items-baseline">
                  <span>5·3 blitz+</span>
                  <span style={{ color: "var(--brutal-magenta)" }}>★★★</span>
                </li>
                <li className="flex justify-between items-baseline">
                  <span>15·10 rapid</span>
                  <span style={{ color: "var(--brutal-magenta)" }}>★★★★</span>
                </li>
                <li className="flex justify-between items-baseline">
                  <span>cpu mode</span>
                  <span style={{ color: "var(--brutal-magenta)" }}>★★★★★</span>
                </li>
              </ul>
              <div className="mt-10" style={{ borderTop: "2px dashed var(--brutal-yellow)" }} />
              <p
                className="mt-5 brutal-display"
                style={{ fontSize: "0.9rem", color: "var(--brutal-paper)" }}
              >
                FREE TO PLAY.<br />
                FREE TO LOSE.<br />
                FREE TO COME BACK.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="brutal-card brutal-card--yellow" style={{ padding: 20 }}>
        <div className="grid items-center gap-6 md:grid-cols-[1fr_260px]">
          <div>
            <div className="brutal-display text-[0.9rem]">LIVE POSITION FEED</div>
            <p className="brutal-chunk mt-2" style={{ fontSize: "1rem" }}>
              Watch the Scholar&apos;s Mate unfold — then go do it for real.
            </p>
          </div>
          <LandingHeroBoard className="mx-auto max-w-[240px]" intervalMs={2000} />
        </div>
      </section>

      <section id="features" className="grid grid-cols-12 gap-5">
        <FeatureCard
          className="col-span-12 md:col-span-6 lg:col-span-4"
          tilt="left"
          variant="yellow"
          num="01"
          title="PAIR ME"
          text="One button. Bullet to classical. The robot finds your opponent."
          sticker="HOT"
        />
        <FeatureCard
          className="col-span-12 md:col-span-6 lg:col-span-4"
          tilt="right"
          variant="magenta"
          num="02"
          title="LINK YOUR HOMIE"
          text="Send a URL. They play in the browser. No account needed for guests."
        />
        <FeatureCard
          className="col-span-12 md:col-span-6 lg:col-span-4"
          tilt="left"
          variant="blue"
          num="03"
          title="CORRESPONDENCE"
          text="Days per turn. Play a game over a whole week if you want."
          sticker="MAIL"
        />
        <FeatureCard
          className="col-span-12 md:col-span-6 lg:col-span-6"
          tilt="right"
          variant="ink"
          num="04"
          title="FIGHT THE FISH"
          text="20 levels of Stockfish. Post-game analysis with eval bar."
          sticker="CPU"
        />
        <FeatureCard
          className="col-span-12 md:col-span-6 lg:col-span-6"
          tilt="left"
          variant="paper"
          num="05"
          title="LEADERBOARD"
          text="Top players. Public profiles. Bragging rights are also free."
        />
      </section>

      <section
        className="brutal-card brutal-card--ink relative text-center"
        style={{ padding: "44px 24px" }}
        data-tilt="right"
      >
        <span className="brutal-sticker brutal-sticker--magenta" style={{ top: -22, left: 32 }} data-tilt="left">
          ★ READY?
        </span>
        <h2 className="brutal-display" style={{ fontSize: "clamp(2rem, 5vw, 3.6rem)" }}>
          STOP READING. START WINNING.
        </h2>
        <div className="mt-6">
          <Link
            to={isAuthenticated ? "/dashboard" : "/login"}
            className="brutal-btn brutal-btn--xl brutal-btn--magenta"
          >
            ▶▶ {isAuthenticated ? "OPEN LOBBY" : "SIGN IN"}
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  className,
  tilt,
  variant,
  num,
  title,
  text,
  sticker,
}: {
  className: string;
  tilt: "left" | "right";
  variant: "yellow" | "magenta" | "blue" | "ink" | "paper";
  num: string;
  title: string;
  text: string;
  sticker?: string;
}) {
  const variantClass =
    variant === "yellow"
      ? "brutal-card--yellow"
      : variant === "magenta"
        ? "brutal-card--magenta"
        : variant === "blue"
          ? "brutal-card--blue"
          : variant === "ink"
            ? "brutal-card--ink"
            : "";
  return (
    <article
      className={`brutal-card ${variantClass} ${className}`}
      style={{ minHeight: 220, position: "relative" }}
      data-tilt={tilt}
    >
      {sticker && (
        <span
          className="brutal-sticker"
          style={{ top: -16, right: -12 }}
          data-tilt={tilt === "left" ? "right" : "left"}
        >
          {sticker}
        </span>
      )}
      <div className="brutal-display" style={{ fontSize: "0.8rem", opacity: 0.7 }}>
        № {num}
      </div>
      <h3 className="brutal-display mt-4" style={{ fontSize: "1.8rem" }}>
        {title}
      </h3>
      <p className="brutal-chunk mt-3" style={{ fontSize: "1rem", lineHeight: 1.4 }}>
        {text}
      </p>
    </article>
  );
}
