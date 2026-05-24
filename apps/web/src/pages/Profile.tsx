import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { useTheme } from "@/theme/themeContext";
import {
  AtelierProfile,
  type AtelierProfileStat,
} from "@/theme/atelier/AtelierProfile";
import {
  BentoProfile,
  type BentoGameHistoryRow,
} from "@/theme/bento/BentoProfile";
import {
  BrutalProfile,
  type BrutalProfileGameRow,
} from "@/theme/brutal/BrutalProfile";
import { ThemeSettingsSection } from "@/components/ThemeSettingsSection";
import { DefaultProfile } from "@/theme/default/DefaultProfile";

const CATEGORIES = [
  "bullet",
  "blitz",
  "rapid",
  "classical",
  "correspondence",
] as const;

function gameResult(
  game: Doc<"games">,
  userId: Id<"users">,
): { label: string; className: string; tone: BentoGameHistoryRow["resultTone"] } {
  const isWhite = game.whiteUserId === userId;
  const isBlack = game.blackUserId === userId;
  if (!isWhite && !isBlack) {
    return { label: "—", className: "text-stone-400", tone: "neutral" };
  }
  if (!game.winner) {
    return { label: "Draw", className: "text-stone-300", tone: "draw" };
  }
  const won =
    (game.winner === "white" && isWhite) || (game.winner === "black" && isBlack);
  return won
    ? { label: "Win", className: "text-green-400", tone: "win" }
    : { label: "Loss", className: "text-red-400", tone: "loss" };
}

function opponentName(game: Doc<"games">, userId: Id<"users">): string {
  if (game.whiteUserId === userId) {
    return game.blackGuestName ?? "Opponent";
  }
  return game.whiteGuestName ?? "Opponent";
}

export function Profile() {
  const user = useQuery(api.users.current);
  const stats = useQuery(
    api.users.getStats,
    user ? { userId: user._id } : "skip",
  );
  const updateProfile = useMutation(api.users.updateProfile);
  const { results: finishedGames, status, loadMore } = usePaginatedQuery(
    api.games.listMyFinished,
    user ? {} : "skip",
    { initialNumItems: 10 },
  );
  const { theme } = useTheme();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName ?? user.name ?? "");
      setBio(user.bio ?? "");
    }
  }, [user]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await updateProfile({ displayName, bio: bio || undefined });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const gameHistory = useMemo((): BentoGameHistoryRow[] => {
    if (!user) return [];
    return finishedGames.map((game) => {
      const result = gameResult(game, user._id);
      return {
        gameId: game._id,
        opponent: opponentName(game, user._id),
        resultLabel: result.label,
        resultTone: result.tone,
        category: game.timeControlCategory ?? "—",
        date: new Date(game.updatedAt).toLocaleDateString(),
      };
    });
  }, [finishedGames, user]);

  const brutalGameRows = useMemo((): BrutalProfileGameRow[] => {
    return gameHistory.map((row) => ({
      gameId: row.gameId,
      opponent: row.opponent,
      resultLabel: row.resultLabel,
      resultTone: row.resultTone,
      category: row.category,
      date: row.date,
    }));
  }, [gameHistory]);

  if (!user) {
    if (theme === "atelier") {
      return (
        <p className="atelier-smallcaps text-center mt-12" style={{ color: "var(--atelier-brass)" }}>
          Opening the ledger…
        </p>
      );
    }
    if (theme === "bento") {
      return (
        <p className="bento-mono opacity-60" style={{ marginTop: 32 }}>
          Loading profile…
        </p>
      );
    }
    if (theme === "brutal") {
      return (
        <p className="brutal-display" style={{ fontSize: "1.4rem", marginTop: 32 }}>
          LOADING PROFILE…
        </p>
      );
    }
    return <p className="default-mono text-[var(--default-mist)]">Loading profile…</p>;
  }

  const atelierStats: AtelierProfileStat[] | null = stats
    ? CATEGORIES.map((cat) => ({
        category: cat,
        wins: stats[cat].wins,
        losses: stats[cat].losses,
        draws: stats[cat].draws,
      }))
    : null;

  const brutalStats = stats
    ? {
        byCategory: {
          bullet: stats.bullet,
          blitz: stats.blitz,
          rapid: stats.rapid,
          classical: stats.classical,
          correspondence: stats.correspondence,
        },
        totalWins: stats.totalWins,
        totalLosses: stats.totalLosses,
        totalDraws: stats.totalDraws,
      }
    : undefined;

  const themeSettings = <ThemeSettingsSection className="mb-8" />;

  switch (theme) {
    case "atelier":
      return (
        <>
          {themeSettings}
          <AtelierProfile
          loading={false}
          rating={user.rating ?? 1200}
          displayName={displayName}
          onDisplayNameChange={setDisplayName}
          bio={bio}
          onBioChange={setBio}
          saved={saved}
          onSubmit={onSubmit}
          stats={atelierStats}
          totalWins={stats?.totalWins ?? 0}
          totalLosses={stats?.totalLosses ?? 0}
          totalDraws={stats?.totalDraws ?? 0}
          gameRows={gameHistory.map((row) => ({
            id: row.gameId,
            opponent: row.opponent,
            resultLabel: row.resultLabel,
            resultTone: row.resultTone,
            category: row.category,
            date: row.date,
            reviewHref: `/game/${row.gameId}/review`,
          }))}
          canLoadMore={status === "CanLoadMore"}
          onLoadMore={() => loadMore(10)}
        />
        </>
      );
    case "bento":
      return (
        <>
          {themeSettings}
          <BentoProfile
          user={user}
          stats={stats ?? undefined}
          displayName={displayName}
          setDisplayName={setDisplayName}
          bio={bio}
          setBio={setBio}
          onSubmit={onSubmit}
          saved={saved}
          gameHistory={gameHistory}
          canLoadMore={status === "CanLoadMore"}
          onLoadMore={() => loadMore(10)}
        />
        </>
      );
    case "brutal":
      return (
        <>
          {themeSettings}
          <BrutalProfile
          user={user}
          stats={brutalStats}
          displayName={displayName}
          setDisplayName={setDisplayName}
          bio={bio}
          setBio={setBio}
          saved={saved}
          onSubmit={onSubmit}
          gameRows={brutalGameRows}
          canLoadMore={status === "CanLoadMore"}
          onLoadMore={() => loadMore(10)}
        />
        </>
      );
    default:
      return (
        <>
          {themeSettings}
          <DefaultProfile
          user={user}
          stats={stats ?? undefined}
          displayName={displayName}
          setDisplayName={setDisplayName}
          bio={bio}
          setBio={setBio}
          onSubmit={onSubmit}
          saved={saved}
          finishedGames={finishedGames}
          canLoadMore={status === "CanLoadMore"}
          onLoadMore={() => loadMore(10)}
        />
        </>
      );
  }
}
