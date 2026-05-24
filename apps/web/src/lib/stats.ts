/** Win rate as a percentage of all finished games in the category (wins / total). */
export function categoryWinRatePercent(
  wins: number,
  losses: number,
  draws: number,
): string {
  const total = wins + losses + draws;
  if (total === 0) {
    return "—";
  }
  return `${Math.round((wins / total) * 100)}%`;
}
