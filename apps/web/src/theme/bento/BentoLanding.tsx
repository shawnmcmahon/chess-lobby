import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function BentoLanding({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  return (
    <div className="bento-grid" style={{ marginTop: 16 }}>
      <section
        className="bento-tile bento-tile--ink col-span-12 lg:col-span-8"
        style={{ padding: "44px 40px", minHeight: 360, animationDelay: "0ms" }}
      >
        <div className="flex items-start justify-between">
          <div className="bento-pill">No. 064 · Édition 2026</div>
          <div className="bento-pill">live · 24/7</div>
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
        className="bento-tile bento-tile--bone col-span-12 lg:col-span-4"
        style={{ padding: 28, minHeight: 360, animationDelay: "80ms" }}
      >
        <div className="bento-tile__eyebrow">Today</div>
        <div className="mt-3 grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <Stat number="14k" label="players online" />
          <Stat number="3.2m" label="moves / day" />
          <Stat number="64" label="time controls" />
          <Stat number="∞" label="rematches" />
        </div>
        <div className="bento-divider" />
        <p
          style={{
            fontFamily: "'Fraunces', serif",
            fontStyle: "italic",
            fontSize: "1.1rem",
            lineHeight: 1.3,
          }}
        >
          “Every game is a small essay on attention.”
        </p>
        <div className="bento-mono mt-2 text-[0.7rem] opacity-60">— editor's note</div>
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
        text="Twenty levels. Honest evaluation. Annotated review."
      />
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

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <div
        className="bento-tile__num"
        style={{ fontSize: "2.2rem", color: "var(--bento-ink)" }}
      >
        {number}
      </div>
      <div className="bento-mono text-[0.66rem] uppercase tracking-[0.16em] opacity-60">
        {label}
      </div>
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
      id="features"
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
