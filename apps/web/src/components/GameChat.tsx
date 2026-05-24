import { useMutation, useQuery } from "convex/react";
import { useState, type FormEvent } from "react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { GameParticipantPresence } from "@/components/GameParticipantPresence";
import { GameSpectatorPresence } from "@/components/GameSpectatorPresence";
import type { GameChatViewerRole } from "@/lib/gameChat";
import { useTheme } from "@/theme/themeContext";
import type { ThemeId } from "@/theme/themes";

type GameChatProps = {
  gameId: Id<"games">;
  viewerRole: GameChatViewerRole;
  isParticipant: boolean;
  isPrivate?: boolean;
  guestSessionId?: string;
  guestName?: string;
  currentUserId?: Id<"users">;
  headerLabel?: string;
};

type GameObserver = {
  key: string;
  userId?: Id<"users">;
  guestSessionId?: string;
  displayName: string;
  online: boolean;
};

const CHAT_THEMES: Record<
  ThemeId,
  {
    shell: string;
    header: string;
    observers: string;
    observerName: string;
    body: string;
    empty: string;
    bubble: string;
    bubbleObserver: string;
    sender: string;
    roleTag: string;
    form: string;
    input: string;
    button: string;
    readonly: string;
  }
> = {
  default: {
    shell: "default-chat",
    header: "default-chat__header",
    observers: "default-chat__observers",
    observerName: "default-chat__observer-name",
    body: "default-chat__body",
    empty: "default-chat__empty",
    bubble: "default-chat__bubble",
    bubbleObserver: "default-chat__bubble default-chat__bubble--observer",
    sender: "default-chat__sender",
    roleTag: "default-chat__role-tag",
    form: "default-chat__form",
    input: "default-chat__input",
    button: "default-btn default-btn--primary",
    readonly: "default-chat__readonly",
  },
  bento: {
    shell: "bento-chat",
    header: "bento-chat__header",
    observers: "bento-chat__observers",
    observerName: "bento-chat__observer-name",
    body: "bento-chat__body",
    empty: "bento-chat__empty",
    bubble: "bento-chat__bubble",
    bubbleObserver: "bento-chat__bubble bento-chat__bubble--observer",
    sender: "bento-chat__sender",
    roleTag: "bento-chat__role-tag",
    form: "bento-chat__form",
    input: "bento-chat__input",
    button: "bento-btn bento-btn--jade",
    readonly: "bento-chat__readonly",
  },
  brutal: {
    shell: "brutal-chat",
    header: "brutal-chat__header",
    observers: "brutal-chat__observers",
    observerName: "brutal-chat__observer-name",
    body: "brutal-chat__body",
    empty: "brutal-chat__empty",
    bubble: "brutal-chat__bubble",
    bubbleObserver: "brutal-chat__bubble brutal-chat__bubble--observer",
    sender: "brutal-chat__sender",
    roleTag: "brutal-chat__role-tag",
    form: "brutal-chat__form",
    input: "brutal-chat__input",
    button: "brutal-btn brutal-btn--yellow",
    readonly: "brutal-chat__readonly",
  },
  atelier: {
    shell: "atelier-chat",
    header: "atelier-chat__header",
    observers: "atelier-chat__observers",
    observerName: "atelier-chat__observer-name",
    body: "atelier-chat__body",
    empty: "atelier-chat__empty",
    bubble: "atelier-chat__bubble",
    bubbleObserver: "atelier-chat__bubble atelier-chat__bubble--observer",
    sender: "atelier-chat__sender",
    roleTag: "atelier-chat__role-tag",
    form: "atelier-chat__form",
    input: "atelier-chat__input",
    button: "atelier-btn atelier-btn--brass",
    readonly: "atelier-chat__readonly",
  },
};

function isSelfObserver(
  observer: GameObserver,
  currentUserId?: Id<"users">,
  guestSessionId?: string,
): boolean {
  return (
    (currentUserId !== undefined && observer.userId === currentUserId) ||
    (guestSessionId !== undefined && observer.guestSessionId === guestSessionId)
  );
}

function ObserverList({
  observers,
  styles,
  currentUserId,
  guestSessionId,
}: {
  observers: GameObserver[] | undefined;
  styles: (typeof CHAT_THEMES)[ThemeId];
  currentUserId?: Id<"users">;
  guestSessionId?: string;
}) {
  const loaded = observers !== undefined;
  const allObservers = observers ?? [];
  const total = allObservers.length;
  const totalLabel = !loaded
    ? "Checking for observers…"
    : total === 0
      ? "No observers watching"
      : total === 1
        ? "1 observer watching"
        : `${total} observers watching`;

  return (
    <div className={styles.observers}>
      <span>{totalLabel}</span>
      {loaded && total > 0 && (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {allObservers.map((observer) => (
            <span key={observer.key} className={styles.observerName}>
              {observer.displayName}
              {isSelfObserver(observer, currentUserId, guestSessionId)
                ? " (you)"
                : ""}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function GameChat({
  gameId,
  viewerRole,
  isParticipant,
  isPrivate = false,
  guestSessionId,
  guestName,
  currentUserId,
  headerLabel = "Game chat",
}: GameChatProps) {
  const { theme } = useTheme();
  const styles = CHAT_THEMES[theme];
  const messages = useQuery(api.chat.list, { gameId, guestSessionId });
  const observers = useQuery(api.presence.listGameObservers, {
    gameId,
    guestSessionId,
  });
  const send = useMutation(api.chat.send);
  const [body, setBody] = useState("");

  const canSend =
    viewerRole === "player" || (viewerRole === "observer" && !isPrivate);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || !canSend) return;
    await send({
      gameId,
      body: text,
      guestSessionId,
      guestName,
    });
    setBody("");
  }

  return (
    <>
      <GameParticipantPresence
        gameId={gameId}
        isParticipant={isParticipant}
        guestSessionId={guestSessionId}
      />
      <GameSpectatorPresence
        gameId={gameId}
        isParticipant={isParticipant}
        isPrivate={isPrivate}
        guestSessionId={guestSessionId}
        guestName={guestName}
      />
      <div className={`flex h-full min-h-[280px] flex-col ${styles.shell}`}>
        <div className={styles.header}>
          <div>{headerLabel}</div>
          <ObserverList
            observers={observers}
            styles={styles}
            currentUserId={currentUserId}
            guestSessionId={guestSessionId}
          />
        </div>
        <div className={`flex-1 space-y-2 overflow-y-auto p-3 text-sm ${styles.body}`}>
          {messages?.length === 0 && (
            <p className={styles.empty}>
              {viewerRole === "observer"
                ? "Say hello to the players."
                : "Say hello to your opponent."}
            </p>
          )}
          {messages?.map((msg) => {
            const isSelf =
              (currentUserId && msg.senderUserId === currentUserId) ||
              (guestSessionId && msg.senderGuestSessionId === guestSessionId);
            const isObserverMessage = msg.senderRoleResolved === "observer";
            return (
              <div
                key={msg._id}
                className={isObserverMessage ? styles.bubbleObserver : styles.bubble}
              >
                <span className={styles.sender}>
                  {msg.senderName}
                  {isSelf ? " (you)" : ""}
                  {isObserverMessage && (
                    <span className={styles.roleTag}> · observing</span>
                  )}
                  :{" "}
                </span>
                <span>{msg.body}</span>
              </div>
            );
          })}
        </div>
        {canSend ? (
          <form onSubmit={(e) => void onSubmit(e)} className={`flex gap-2 p-2 ${styles.form}`}>
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={
                viewerRole === "observer" ? "Message the players…" : "Type a message…"
              }
              className={`flex-1 text-sm outline-none ${styles.input}`}
            />
            <button type="submit" className={styles.button}>
              Send
            </button>
          </form>
        ) : (
          <p className={`p-3 text-sm ${styles.readonly}`}>
            Sign in to join the conversation.
          </p>
        )}
      </div>
    </>
  );
}
