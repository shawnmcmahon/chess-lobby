export function formatDaysLeft(deadlineAt: number, now: number): string {
  const msLeft = Math.max(0, deadlineAt - now);
  const days = Math.ceil(msLeft / 86_400_000);
  if (days <= 0) return "Time expired";
  return days === 1 ? "1 day left" : `${days} days left`;
}

export function formatCorrespondenceClock(
  turnDeadlineAt: number | undefined,
  daysPerTurn: number | undefined,
  currentTurn: "white" | "black",
  now: number,
): string {
  if (!daysPerTurn || !turnDeadlineAt) return "No turn timer";
  return `${currentTurn === "white" ? "White" : "Black"} to move · ${formatDaysLeft(turnDeadlineAt, now)}`;
}
