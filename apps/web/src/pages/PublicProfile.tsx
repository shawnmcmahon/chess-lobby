import { usePaginatedQuery, useQuery } from "convex/react";
import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { useTheme } from "@/theme/themeContext";
import { AtelierPublicProfile } from "@/theme/atelier/AtelierPublicProfile";
import type { AtelierProfileStat } from "@/theme/atelier/AtelierProfile";
import {
  BentoPublicProfile,
  BentoPublicProfileLoading,
  BentoPublicProfileMissing,
  BentoPublicProfileNotFound,
} from "@/theme/bento/BentoPublicProfile";
import type { BentoGameHistoryRow } from "@/theme/bento/BentoProfile";
import {
  BrutalPublicProfile,
  type BrutalPublicProfileGameRow,
} from "@/theme/brutal/BrutalPublicProfile";
import { DefaultPublicProfile } from "@/theme/default/DefaultPublicProfile";

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

export function PublicProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { theme } = useTheme();
  const profile = useQuery(
    api.users.getPublicProfile,
    userId ? { userId: userId as Id<"users"> } : "skip",
  );
  const stats = useQuery(
    api.users.getStats,
    userId ? { userId: userId as Id<"users"> } : "skip",
  );
  const { results: finishedGames, status, loadMore } = usePaginatedQuery(
    api.games.listFinishedForUser,
    userId ? { userId: userId as Id<"users"> } : "skip",
    { initialNumItems: 10 },
  );

  const gameHistory = useMemo((): BentoGameHistoryRow[] => {
    if (!profile) return [];
    return finishedGames.map((game) => {
      const result = gameResult(game, profile._id);
      return {
        gameId: game._id,
        opponent: "—",
        resultLabel: result.label,
        resultTone: result.tone,
        category: game.timeControlCategory ?? "—",
        date: new Date(game.updatedAt).toLocaleDateString(),
      };
    });
  }, [finishedGames, profile]);

  const brutalGameRows = useMemo((): BrutalPublicProfileGameRow[] => {
    return gameHistory.map((row) => ({
      gameId: row.gameId,
      resultLabel: row.resultLabel,
      resultTone: row.resultTone,
      category: row.category,
      date: row.date,
    }));
  }, [gameHistory]);

  const atelierStatus = !userId
    ? ("missing" as const)
    : profile === undefined
      ? ("loading" as const)
      : !profile
        ? ("not_found" as const)
        : ("ready" as const);

  const defaultView = !userId
    ? ("missing" as const)
    : profile === undefined
      ? ("loading" as const)
      : !profile
        ? ("notFound" as const)
        : ("ready" as const);

  if (theme === "atelier") {
    const atelierStats: AtelierProfileStat[] | undefined = stats
      ? CATEGORIES.map((cat) => ({
          category: cat,
          wins: stats[cat].wins,
          losses: stats[cat].losses,
          draws: stats[cat].draws,
        }))
      : undefined;

    return (
      <AtelierPublicProfile
        status={atelierStatus}
        displayName={profile?.displayName}
        rating={profile?.rating ?? 1200}
        bio={profile?.bio}
        stats={atelierStats}
        gameRows={gameHistory.map((row) => ({
          id: row.gameId,
          resultLabel: row.resultLabel,
          resultTone: row.resultTone,
          category: row.category,
          date: row.date,
        }))}
        canLoadMore={status === "CanLoadMore"}
        onLoadMore={() => loadMore(10)}
      />
    );
  }

  if (theme === "bento") {
    if (!userId) return <BentoPublicProfileMissing />;
    if (profile === undefined) return <BentoPublicProfileLoading />;
    if (!profile) return <BentoPublicProfileNotFound />;
    return (
      <BentoPublicProfile
        profile={profile as Doc<"users">}
        stats={stats ?? undefined}
        gameHistory={gameHistory}
        canLoadMore={status === "CanLoadMore"}
        onLoadMore={() => loadMore(10)}
      />
    );
  }

  if (theme === "brutal") {
    const brutalStats = stats
      ? {
          byCategory: {
            bullet: stats.bullet,
            blitz: stats.blitz,
            rapid: stats.rapid,
            classical: stats.classical,
            correspondence: stats.correspondence,
          },
        }
      : undefined;

    return (
      <BrutalPublicProfile
        view={defaultView}
        profile={profile as Doc<"users"> | null | undefined}
        stats={brutalStats}
        gameRows={brutalGameRows}
        canLoadMore={status === "CanLoadMore"}
        onLoadMore={() => loadMore(10)}
      />
    );
  }

  return (
    <DefaultPublicProfile
      view={defaultView}
      profile={profile}
      stats={stats}
      finishedGames={finishedGames}
      canLoadMore={status === "CanLoadMore"}
      onLoadMore={() => loadMore(10)}
    />
  );
}
