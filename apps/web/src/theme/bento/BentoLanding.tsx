import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { LandingHeroBoard } from "@/components/landing/LandingHeroBoard";
import { LandingLiveStats } from "@/components/landing/LandingLiveStats";

export function BentoLanding({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  return (
    <div className="bento-grid" style={{ marginTop: 16 }}>
      <section
        className="bento-tile bento-tile--ink col-span-12 lg:col-span-8"
        style={{ padding: "44px 40px", minHeight: 360, animationDelay: "0ms", position: "relative" }}
      >
        <div className="flex items-start justify-between">
          <div className="bento-pill">No. 064 · Édition 2026</div>
          <LandingLiveStats
            render={({ inPlayCount, loading }) => (
              <div className="bento-pill">
                {loading ? "live · …" : `${inPlayCount ?? 0} in play`}
              </div>
            )}
          />
        </div>
        <h1
          className="bento-tile__title"
          style={{ fontSize: "3.6rem", marginTop: 36, maxWidth: "16ch" }}
        >
          A quiet place <em>to think</em>
          <br />
          and a loud place <em>to win.</em>
        </h1>
        <p
          className="bento-mono"
          style={{
            marginTop: 28,
            opacity: 0.75,
            fontSize: "0.78rem",
            maxWidth: "44ch",
            lineHeight: 1.7,
          }}
        >
          A chess lobby curated like a magazine. Quick pairs, friend invites,
          correspondence and Stockfish — laid out in tiles you'll actually want
          to read.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          {isAuthenticated ? (
            <Link to="/dashboard" className="bento-btn bento-btn--jade">
              Open dashboard →
            </Link>
          ) : (
            <Link to="/login" className="bento-btn bento-btn--jade">
              Begin — sign in
            </Link>
          )}
          <a href="#features" className="bento-btn bento-btn--ghost" style={{ color: "var(--bento-paper)", borderColor: "rgba(245,241,234,0.3)" }}>
            See the tiles
          </a>
        </div>
        <BoardWatermark />
      </section>

      <section
        className="bento-tile bento-tile--bone col-span-12 lg:col-span-4 bento-photo-tile"
        style={{ padding: 0, minHeight: 360, animationDelay: "80ms", overflow: "hidden" }}
      >
        <img
          src="/landing/bento-editorial.jpg"
          alt=""
          className="bento-photo-tile__img"
          loading="lazy"
        />
        <div className="bento-photo-tile__caption">
          <div className="bento-tile__eyebrow">Editorial</div>
          <p
            style={{
              fontFamily: "'Fraunces', serif",
              fontStyle: "italic",
              fontSize: "1.1rem",
              lineHeight: 1.3,
              marginTop: 8,
            }}
          >
            “Every game is a small essay on attention.”
          </p>
        </div>
      </section>

      <section
        id="features"
        className="bento-tile bento-tile--paper col-span-12"
        style={{ padding: 20, animationDelay: "120ms" }}
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_280px] lg:items-center">
          <div>
            <div className="bento-tile__eyebrow">Live position</div>
            <p className="bento-mono mt-2 text-[0.72rem] opacity-70">
              Scholar&apos;s Mate sequence — cycles on the landing dome.
            </p>
          </div>
          <LandingHeroBoard className="max-w-[240px] mx-auto" intervalMs={2600} />
        </div>
      </section>

      <FeatureTile
        delay={160}
        className="col-span-6 lg:col-span-3"
        variant="paper"
        eyebrow="01"
        title={<>Quick<br />pairing</>}
        text="One click. Bullet to classical. We match by rating."
      />
      <FeatureTile
        delay={240}
        className="col-span-6 lg:col-span-3"
        variant="jade"
        eyebrow="02"
        title={<>Invite a<br /><em>friend</em></>}
        text="A single link. Plays in any browser, guest or signed in."
      />
      <FeatureTile
        delay={320}
        className="col-span-6 lg:col-span-3"
        variant="clay"
        eyebrow="03"
        title={<>Correspondence</>}
        text="Days per turn. Live the game across coffees and trains."
      />
      <FeatureTile
        delay={400}
        className="col-span-6 lg:col-span-3"
        variant="ink"
        eyebrow="04"
        title={<>Stockfish<br />sparring</>}
        text="Eleven cadences. Twenty engine levels. Post-game analysis."
      />

      <section
        className="bento-tile bento-tile--jade col-span-12 text-center"
        style={{ padding: "36px 28px", animationDelay: "480ms" }}
      >
        <h2 className="bento-tile__title" style={{ fontSize: "2rem" }}>
          The tiles are set. <em>Take a seat.</em>
        </h2>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to={isAuthenticated ? "/dashboard" : "/login"}
            className="bento-btn"
            style={{ background: "var(--bento-paper)", color: "var(--bento-jade)" }}
          >
            {isAuthenticated ? "Enter dashboard" : "Sign in to play"}
          </Link>
          <Link to="/leaderboard" className="bento-btn bento-btn--ghost" style={{ color: "var(--bento-paper)", borderColor: "rgba(255,255,255,0.35)" }}>
            Leaderboard
          </Link>
        </div>
      </section>
    </div>
  );
}

function BoardWatermark() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        right: -40,
        bottom: -40,
        width: 280,
        height: 280,
        opacity: 0.08,
        pointerEvents: "none",
      }}
    >
      <svg viewBox="0 0 8 8" width="100%" height="100%">
        {Array.from({ length: 64 }).map((_, i) => {
          const r = Math.floor(i / 8);
          const c = i % 8;
          const dark = (r + c) % 2 === 1;
          return (
            <rect
              key={i}
              x={c}
              y={r}
              width={1}
              height={1}
              fill={dark ? "#f5f1ea" : "transparent"}
            />
          );
        })}
      </svg>
    </div>
  );
}

function FeatureTile({
  delay,
  className,
  variant,
  eyebrow,
  title,
  text,
}: {
  delay: number;
  className: string;
  variant: "paper" | "ink" | "jade" | "clay";
  eyebrow: string;
  title: ReactNode;
  text: string;
}) {
  const variantClass =
    variant === "ink"
      ? "bento-tile--ink"
      : variant === "jade"
        ? "bento-tile--jade"
        : variant === "clay"
          ? "bento-tile--clay"
          : "";
  return (
    <section
      className={`bento-tile ${variantClass} ${className}`}
      style={{ padding: 24, minHeight: 220, animationDelay: `${delay}ms` }}
    >
      <div className="bento-tile__eyebrow">{eyebrow}</div>
      <h3
        className="bento-tile__title"
        style={{ fontSize: "1.65rem", marginTop: 18, lineHeight: 1.05 }}
      >
        {title}
      </h3>
      <p
        className="bento-mono"
        style={{
          marginTop: 18,
          fontSize: "0.72rem",
          lineHeight: 1.6,
          opacity: 0.78,
        }}
      >
        {text}
      </p>
    </section>
  );
}
