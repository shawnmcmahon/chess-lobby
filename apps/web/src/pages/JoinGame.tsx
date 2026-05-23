import { useMutation, useQuery } from "convex/react";
import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../../../convex/_generated/api";
import { getGuestSessionId } from "@/lib/guestSession";
import { useConvexAuth } from "convex/react";
import { useTheme } from "@/theme/themeContext";
import {
  AtelierJoinGame,
  type AtelierJoinGameStatus,
} from "@/theme/atelier/AtelierJoinGame";
import { BentoJoinGame } from "@/theme/bento/BentoJoinGame";
import { BrutalJoinGame } from "@/theme/brutal/BrutalJoinGame";
import { DefaultJoinGame } from "@/theme/default/DefaultJoinGame";

export function JoinGame() {
  const { inviteToken } = useParams<{ inviteToken: string }>();
  const { isAuthenticated } = useConvexAuth();
  const { theme } = useTheme();
  const game = useQuery(
    api.games.getByInviteToken,
    inviteToken ? { inviteToken } : "skip",
  );
  const join = useMutation(api.games.joinByInvite);
  const navigate = useNavigate();
  const [guestName, setGuestName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onJoin(e?: FormEvent) {
    e?.preventDefault();
    if (!inviteToken) return;
    setError(null);
    try {
      const gameId = await join({
        inviteToken,
        guestName: isAuthenticated ? undefined : guestName.trim(),
        guestSessionId: isAuthenticated ? undefined : getGuestSessionId(),
      });
      navigate(`/game/${gameId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join game");
    }
  }

  const joinStatus: AtelierJoinGameStatus = !inviteToken
    ? "invalid"
    : game === undefined
      ? "loading"
      : !game
        ? "not_found"
        : game.status !== "waiting"
          ? "not_waiting"
          : "ready";

  if (theme === "atelier") {
    return (
      <AtelierJoinGame
        status={joinStatus}
        isAuthenticated={isAuthenticated}
        guestName={guestName}
        onGuestNameChange={setGuestName}
        joinAsLabel={game?.whiteUserId ? "black" : "player"}
        error={error}
        onJoin={onJoin}
        onViewGame={() => game && navigate(`/game/${game._id}`)}
      />
    );
  }

  if (theme === "bento") {
    if (!inviteToken) {
      return <BentoJoinGame state="invalid-token" />;
    }
    if (game === undefined) {
      return <BentoJoinGame state="loading" />;
    }
    if (!game) {
      return <BentoJoinGame state="not-found" />;
    }
    if (game.status !== "waiting") {
      return (
        <BentoJoinGame
          state="not-waiting"
          gameId={game._id}
          onViewGame={() => navigate(`/game/${game._id}`)}
        />
      );
    }
    return (
      <BentoJoinGame
        state="ready"
        game={game}
        isAuthenticated={isAuthenticated}
        guestName={guestName}
        setGuestName={setGuestName}
        onJoin={onJoin}
        error={error}
      />
    );
  }

  if (theme === "brutal") {
    if (!inviteToken) {
      return <BrutalJoinGame view="invalid" />;
    }
    if (game === undefined) {
      return <BrutalJoinGame view="loading" />;
    }
    if (!game) {
      return <BrutalJoinGame view="notFound" />;
    }
    if (game.status !== "waiting") {
      return (
        <BrutalJoinGame
          view="notWaiting"
          onViewGame={() => navigate(`/game/${game._id}`)}
        />
      );
    }
    return (
      <BrutalJoinGame
        view="join"
        isAuthenticated={isAuthenticated}
        joinSideLabel={game.whiteUserId ? "black" : "player"}
        guestName={guestName}
        setGuestName={setGuestName}
        onJoin={onJoin}
        error={error}
      />
    );
  }

  if (!inviteToken) {
    return <DefaultJoinGame view="invalid" />;
  }
  if (game === undefined) {
    return <DefaultJoinGame view="loading" />;
  }
  if (!game) {
    return <DefaultJoinGame view="notFound" />;
  }
  if (game.status !== "waiting") {
    return (
      <DefaultJoinGame
        view="notWaiting"
        onViewGame={() => navigate(`/game/${game._id}`)}
      />
    );
  }
  return (
    <DefaultJoinGame
      view="join"
      isAuthenticated={isAuthenticated}
      joinSideLabel={game.whiteUserId ? "black" : "player"}
      guestName={guestName}
      setGuestName={setGuestName}
      onJoin={onJoin}
      error={error}
    />
  );
}
