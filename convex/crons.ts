import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "process live clock timeouts",
  { minutes: 1 },
  internal.games.processLiveTimeouts,
  {},
);

crons.interval(
  "process correspondence timeouts",
  { hours: 1 },
  internal.games.processCorrespondenceTimeouts,
  {},
);

crons.interval(
  "process inactive live game sessions",
  { seconds: 30 },
  internal.games.processInactiveGameSessions,
  {},
);

crons.interval(
  "process expired waiting games",
  { minutes: 5 },
  internal.games.processExpiredWaitingGames,
  {},
);

export default crons;
