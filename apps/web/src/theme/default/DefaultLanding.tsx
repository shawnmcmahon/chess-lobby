import { Link } from "react-router-dom";
import { LandingHeroBoard } from "@/components/landing/LandingHeroBoard";
import { LandingLiveStats } from "@/components/landing/LandingLiveStats";

export function DefaultLanding({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <div className="default-landing space-y-16 pb-8">
      <section className="default-hero-split grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
        <div className="space-y-6">
          <p className="default-mono text-[0.68rem] uppercase tracking-[0.32em] text-[var(--default-ember-dim)]">
            Ember Observatory · No. 064
          </p>
          <h1 className="default-display text-[clamp(2.4rem,5vw,3.8rem)] leading-[1.05]">
            Watch the board glow under a{" "}
            <span className="italic text-[var(--default-ember)]">midnight dome.</span>
          </h1>
          <p className="max-w-md text-[var(--default-mist)] leading-relaxed">
            A cinematic chess lobby for players who like their nights long and their
            clocks honest. Pair instantly, invite friends, correspondence across time
            zones, or spar with Stockfish beneath the stars.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            {isAuthenticated ? (
              <Link to="/dashboard" className="default-btn default-btn--primary">
                Enter the observatory
              </Link>
            ) : (
              <Link to="/login" className="default-btn default-btn--primary">
                Sign in to play
              </Link>
            )}
            <a href="#features" className="default-btn default-btn--ghost">
              Explore features
            </a>
          </div>
          <LandingLiveStats
            render={({ inPlayCount, waitingCount, loading }) => (
              <div className="default-live-strip default-glass mt-4 inline-flex flex-wrap gap-6 px-5 py-3">
                <LiveStat
                  label="In play"
                  value={loading ? "—" : String(inPlayCount ?? 0)}
                />
                <LiveStat
                  label="Waiting"
                  value={loading ? "—" : String(waitingCount ?? 0)}
                />
                <LiveStat label="Sky" value="Clear" />
              </div>
            )}
          />
        </div>
        <div className="default-board-frame relative">
          <div
            className="default-hero-photo absolute inset-0 opacity-30"
            style={{
              backgroundImage: "url(/landing/default-observatory.jpg)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              maskImage: "linear-gradient(to left, black, transparent)",
              WebkitMaskImage: "linear-gradient(to left, black, transparent)",
            }}
            aria-hidden
          />
          <div className="default-board-frame__glow" aria-hidden />
          <LandingHeroBoard className="default-board-frame__inner overflow-hidden rounded-lg relative z-[1]" />
        </div>
      </section>

      <section id="features" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FeatureCard
          index="01"
          title="Quick pairing"
          body="Bullet to classical. One click, rating-matched opponents, no ceremony."
        />
        <FeatureCard
          index="02"
          title="Invite links"
          body="Share a single URL. Guests play without accounts; friends join signed in."
          accent
        />
        <FeatureCard
          index="03"
          title="Correspondence"
          body="Days per turn. Long games for long nights — or long weeks."
        />
        <FeatureCard
          index="04"
          title="Engine review"
          body="Twenty Stockfish levels. Honest evaluation when the embers die down."
        />
      </section>

      <section className="default-panel default-panel--accent p-8 text-center lg:p-12">
        <p className="default-mono text-[0.68rem] uppercase tracking-[0.28em] text-[var(--default-ember-dim)]">
          Closing transmission
        </p>
        <h2 className="default-display mt-4 text-[clamp(1.8rem,4vw,2.8rem)]">
          The dome is open. <span className="italic">Your move.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-[var(--default-mist)]">
          Step inside, challenge someone online, or paste an invite link into the group
          chat. The board keeps its own time.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to={isAuthenticated ? "/dashboard" : "/login"}
            className="default-btn default-btn--primary"
          >
            {isAuthenticated ? "Open dashboard" : "Create account"}
          </Link>
          <Link to="/leaderboard" className="default-btn default-btn--ghost">
            View leaderboard
          </Link>
        </div>
      </section>
    </div>
  );
}

function LiveStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="default-display text-2xl text-[var(--default-ember)]">{value}</div>
      <div className="default-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--default-mist)]">
        {label}
      </div>
    </div>
  );
}

function FeatureCard({
  index,
  title,
  body,
  accent,
}: {
  index: string;
  title: string;
  body: string;
  accent?: boolean;
}) {
  return (
    <article
      className={`default-panel p-5 ${accent ? "default-panel--accent" : ""}`}
    >
      <span className="default-mono text-[0.62rem] uppercase tracking-[0.24em] text-[var(--default-ember-dim)]">
        {index}
      </span>
      <h3 className="default-display mt-3 text-xl">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-[var(--default-mist)]">{body}</p>
    </article>
  );
}
