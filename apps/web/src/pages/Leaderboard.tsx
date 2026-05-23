import { useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { useTheme } from "@/theme/themeContext";
import {
  AtelierLeaderboard,
  type AtelierLeaderboardCategory,
  type AtelierLeaderboardRow,
  type AtelierLeaderboardSort,
} from "@/theme/atelier/AtelierLeaderboard";
import {
  BentoLeaderboard,
  type BentoLeaderboardCategory,
  type BentoLeaderboardRow,
  type BentoLeaderboardSortBy,
} from "@/theme/bento/BentoLeaderboard";
import { BrutalLeaderboard } from "@/theme/brutal/BrutalLeaderboard";
import { DefaultLeaderboard } from "@/theme/default/DefaultLeaderboard";

type SortBy = BentoLeaderboardSortBy;
type Category = BentoLeaderboardCategory;

function winRatio(wins: number, losses: number, draws: number): string {
  const total = wins + losses + draws;
  if (total === 0) return "—";
  return `${Math.round((wins / total) * 1000) / 10}%`;
}

export function Leaderboard() {
  const [sortBy, setSortBy] = useState<SortBy>("wins");
  const [category, setCategory] = useState<Category>("all");
  const { theme } = useTheme();

  const rawRows = useQuery(api.leaderboard.listTop, {
    sortBy,
    category: category === "all" ? undefined : category,
    limit: 50,
  });

  const rows = useMemo((): BentoLeaderboardRow[] | undefined => {
    if (!rawRows) return undefined;
    return rawRows.map((row) => ({
      ...row,
      winRatio: winRatio(row.wins, row.losses, row.draws),
    }));
  }, [rawRows]);

  const atelierRows: AtelierLeaderboardRow[] | undefined = rows?.map((row) => ({
    userId: row.userId,
    rank: row.rank,
    displayName: row.displayName,
    rating: row.rating,
    wins: row.wins,
    losses: row.losses,
    draws: row.draws,
    winRatio: row.winRatio,
  }));

  switch (theme) {
    case "atelier":
      return (
        <AtelierLeaderboard
          sortBy={sortBy as AtelierLeaderboardSort}
          onSortByChange={setSortBy}
          category={category as AtelierLeaderboardCategory}
          onCategoryChange={setCategory}
          rows={atelierRows}
        />
      );
    case "bento":
      return (
        <BentoLeaderboard
          sortBy={sortBy}
          setSortBy={setSortBy}
          category={category}
          setCategory={setCategory}
          rows={rows}
        />
      );
    case "brutal":
      return (
        <BrutalLeaderboard
          sortBy={sortBy}
          setSortBy={setSortBy}
          category={category}
          setCategory={setCategory}
          rows={rows}
        />
      );
    default:
      return (
        <DefaultLeaderboard
          sortBy={sortBy}
          setSortBy={setSortBy}
          category={category}
          setCategory={setCategory}
          rows={rawRows}
        />
      );
  }
}
