import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

type LandingLiveStatsProps = {
  render: (stats: {
    inPlayCount: number | null;
    waitingCount: number | null;
    loading: boolean;
  }) => React.ReactNode;
};

export function LandingLiveStats({ render }: LandingLiveStatsProps) {
  const stats = useQuery(api.lobbyStats.getPublicStats);
  return (
    <>
      {render({
        inPlayCount: stats?.inPlayCount ?? null,
        waitingCount: stats?.waitingCount ?? null,
        loading: stats === undefined,
      })}
    </>
  );
}
