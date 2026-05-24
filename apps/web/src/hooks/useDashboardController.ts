import { useMutation, useQuery } from "convex/react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { useLobbyPresence } from "@/components/PresenceProvider";
import {
  TIME_CONTROL_PRESETS,
  type TimeControlPreset,
} from "@/lib/timeControl";

export type PlayTab =
  | "quickPair"
  | "friendChallenge"
  | "computer"
  | "correspondence";

export type DashboardController = ReturnType<typeof useDashboardController>;

export function useDashboardController() {
  const user = useQuery(api.users.current);
  const pendingInvites = useQuery(api.invites.listPendingForMe);
  const activeGames = useQuery(api.games.listMyActive);
  const lookingForOpponent = useQuery(
    api.seeks.listLookingForOpponent,
    user ? {} : "skip",
  );
  const sendInvite = useMutation(api.invites.send);
  const acceptInvite = useMutation(api.invites.accept);
  const declineInvite = useMutation(api.invites.decline);
  const createGame = useMutation(api.games.create);
  const createQuickPair = useMutation(api.seeks.createQuickPair);
  const joinQuickPairGame = useMutation(api.seeks.joinQuickPairGame);
  const cancelQuickPair = useMutation(api.seeks.cancelQuickPair);
  const navigate = useNavigate();

  const [tab, setTab] = useState<PlayTab>("quickPair");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState(10);
  const [quickPairLoading, setQuickPairLoading] = useState(false);
  const [pendingQuickPairGameId, setPendingQuickPairGameId] =
    useState<Id<"games"> | null>(null);
  const [daysPerTurn, setDaysPerTurn] = useState(3);
  const [selectedPreset, setSelectedPreset] = useState<TimeControlPreset | null>(
    null,
  );
  const [isPublic, setIsPublic] = useState(true);

  const presenceState = useLobbyPresence();

  const onlineUserIds = useMemo(() => {
    if (!presenceState || !user) return [] as Id<"users">[];
    return presenceState
      .filter((p) => p.online && p.userId !== user._id)
      .map((p) => p.userId as Id<"users">);
  }, [presenceState, user]);

  const onlineUsers = useQuery(
    api.users.listForLobby,
    onlineUserIds.length > 0 ? { userIds: onlineUserIds } : "skip",
  );

  const lobbyCounts = useQuery(
    api.games.getLobbyCounts,
    presenceState ? { onlineCount: onlineUserIds.length + 1 } : "skip",
  );

  useEffect(() => {
    if (!pendingQuickPairGameId || !activeGames) {
      return;
    }
    const game = activeGames.find((g) => g._id === pendingQuickPairGameId);
    if (game?.status === "active") {
      setPendingQuickPairGameId(null);
      navigate(`/game/${game._id}`);
    }
  }, [pendingQuickPairGameId, activeGames, navigate]);

  const otherPlayersOnlineCount = presenceState ? onlineUserIds.length : null;

  async function onQuickPair(preset: TimeControlPreset) {
    setQuickPairLoading(true);
    try {
      const result = await createQuickPair({
        baseTimeMs: preset.baseTimeMs,
        incrementMs: preset.incrementMs,
      });
      if (result.matched) {
        setPendingQuickPairGameId(null);
        navigate(`/game/${result.gameId}`);
      } else {
        setPendingQuickPairGameId(result.gameId);
      }
    } finally {
      setQuickPairLoading(false);
    }
  }

  async function onJoinLookingForOpponent(gameId: Id<"games">) {
    setQuickPairLoading(true);
    try {
      const joinedGameId = await joinQuickPairGame({ gameId });
      navigate(`/game/${joinedGameId}`);
    } finally {
      setQuickPairLoading(false);
    }
  }

  async function onCancelLookingForOpponent(gameId: Id<"games">) {
    await cancelQuickPair({ gameId });
    if (pendingQuickPairGameId === gameId) {
      setPendingQuickPairGameId(null);
    }
  }

  async function onComputer(preset: TimeControlPreset) {
    const { gameId } = await createGame({
      mode: "human_vs_engine",
      engineDifficulty: difficulty,
      playType: "live",
      baseTimeMs: preset.baseTimeMs,
      incrementMs: preset.incrementMs,
      isPublic,
    });
    navigate(`/game/${gameId}`);
  }

  const canInviteOrChallenge =
    tab === "correspondence" || tab === "friendChallenge";
  const showPrivateGameToggle = canInviteOrChallenge || tab === "computer";

  async function challengePlayer(toUserId: Id<"users">) {
    if (tab === "correspondence") {
      const { gameId } = await sendInvite({
        toUserId,
        playType: "correspondence",
        daysPerTurn: daysPerTurn > 0 ? daysPerTurn : undefined,
        isPublic,
      });
      navigate(`/game/${gameId}`);
      return;
    }

    const preset =
      selectedPreset ?? TIME_CONTROL_PRESETS.find((p) => p.label === "5+0");
    const { gameId } = await sendInvite({
      toUserId,
      playType: "live",
      baseTimeMs: preset?.baseTimeMs,
      incrementMs: preset?.incrementMs,
      isPublic,
    });
    navigate(`/game/${gameId}`);
  }

  async function createInviteLink() {
    if (!canInviteOrChallenge) {
      return;
    }
    const preset = selectedPreset;
    const { gameId, inviteToken } = await createGame({
      mode: "human_vs_human",
      playType: tab === "correspondence" ? "correspondence" : "live",
      baseTimeMs: tab === "friendChallenge" ? preset?.baseTimeMs : undefined,
      incrementMs: tab === "friendChallenge" ? preset?.incrementMs : undefined,
      daysPerTurn:
        tab === "correspondence" && daysPerTurn > 0 ? daysPerTurn : undefined,
      isPublic,
    });
    const url = `${window.location.origin}/game/join/${inviteToken}`;
    setInviteLink(url);
    await navigator.clipboard.writeText(url);
    navigate(`/game/${gameId}`);
  }

  function formatCorrespondenceDeadline(game: Doc<"games">) {
    if (!game.daysPerTurn || !game.turnDeadlineAt) return "No timer";
    const days = Math.ceil(
      Math.max(0, game.turnDeadlineAt - Date.now()) / 86_400_000,
    );
    return days <= 0 ? "Deadline passed" : `${days} day${days === 1 ? "" : "s"} left`;
  }

  const myTurnGames = activeGames?.filter(
    (g) =>
      g.status === "active" &&
      ((g.currentTurn === "white" && g.whiteUserId === user?._id) ||
        (g.currentTurn === "black" && g.blackUserId === user?._id)),
  );

  const correspondenceGames = activeGames?.filter(
    (g) =>
      g.playType === "correspondence" &&
      (g.status === "active" || g.status === "waiting"),
  );

  const liveActiveGames = activeGames?.filter(
    (g) =>
      g.playType !== "correspondence" &&
      (g.status === "active" || g.status === "waiting") &&
      !(g.matchSource === "quick_pair" && g.status === "waiting"),
  );

  function canCancelWaitingGame(game: Doc<"games">) {
    return (
      game.status === "waiting" &&
      (game.createdByUserId === user?._id || game.whiteUserId === user?._id)
    );
  }

  return {
    user,
    pendingInvites,
    activeGames,
    lookingForOpponent,
    myTurnGames,
    correspondenceGames,
    liveActiveGames,
    onlineUsers,
    lobbyCounts,
    presenceState,
    tab,
    setTab,
    inviteLink,
    difficulty,
    setDifficulty,
    quickPairLoading,
    daysPerTurn,
    setDaysPerTurn,
    selectedPreset,
    setSelectedPreset,
    isPublic,
    setIsPublic,
    canInviteOrChallenge,
    showPrivateGameToggle,
    canCancelWaitingGame,
    otherPlayersOnlineCount,
    onQuickPair,
    onJoinLookingForOpponent,
    onCancelLookingForOpponent,
    onComputer,
    challengePlayer,
    createInviteLink,
    acceptInvite,
    declineInvite,
    formatCorrespondenceDeadline,
    navigate,
  };
}
