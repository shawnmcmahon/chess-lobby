import { useMutation, useQuery } from "convex/react";
import { useState, type FormEvent } from "react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useTheme } from "@/theme/themeContext";
import type { ThemeId } from "@/theme/themes";

type GameChatProps = {
  gameId: Id<"games">;
  guestSessionId?: string;
  guestName?: string;
  headerLabel?: string;
};

const CHAT_THEMES: Record<
  ThemeId,
  {
    shell: string;
    header: string;
    body: string;
    empty: string;
    bubble: string;
    sender: string;
    form: string;
    input: string;
    button: string;
  }
> = {
  default: {
    shell: "default-chat",
    header: "default-chat__header",
    body: "default-chat__body",
    empty: "default-chat__empty",
    bubble: "default-chat__bubble",
    sender: "default-chat__sender",
    form: "default-chat__form",
    input: "default-chat__input",
    button: "default-btn default-btn--primary",
  },
  bento: {
    shell: "bento-chat",
    header: "bento-chat__header",
    body: "bento-chat__body",
    empty: "bento-chat__empty",
    bubble: "bento-chat__bubble",
    sender: "bento-chat__sender",
    form: "bento-chat__form",
    input: "bento-chat__input",
    button: "bento-btn bento-btn--jade",
  },
  brutal: {
    shell: "brutal-chat",
    header: "brutal-chat__header",
    body: "brutal-chat__body",
    empty: "brutal-chat__empty",
    bubble: "brutal-chat__bubble",
    sender: "brutal-chat__sender",
    form: "brutal-chat__form",
    input: "brutal-chat__input",
    button: "brutal-btn brutal-btn--yellow",
  },
  atelier: {
    shell: "atelier-chat",
    header: "atelier-chat__header",
    body: "atelier-chat__body",
    empty: "atelier-chat__empty",
    bubble: "atelier-chat__bubble",
    sender: "atelier-chat__sender",
    form: "atelier-chat__form",
    input: "atelier-chat__input",
    button: "atelier-btn atelier-btn--brass",
  },
};

export function GameChat({
  gameId,
  guestSessionId,
  guestName,
  headerLabel = "Game chat",
}: GameChatProps) {
  const { theme } = useTheme();
  const styles = CHAT_THEMES[theme];
  const messages = useQuery(api.chat.list, { gameId });
  const send = useMutation(api.chat.send);
  const [body, setBody] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    await send({
      gameId,
      body: text,
      guestSessionId,
      guestName,
    });
    setBody("");
  }

  return (
    <div className={`flex h-full min-h-[280px] flex-col ${styles.shell}`}>
      <div className={styles.header}>{headerLabel}</div>
      <div className={`flex-1 space-y-2 overflow-y-auto p-3 text-sm ${styles.body}`}>
        {messages?.length === 0 && (
          <p className={styles.empty}>Say hello to your opponent.</p>
        )}
        {messages?.map((msg) => (
          <div key={msg._id} className={styles.bubble}>
            <span className={styles.sender}>{msg.senderName}: </span>
            <span>{msg.body}</span>
          </div>
        ))}
      </div>
      <form onSubmit={(e) => void onSubmit(e)} className={`flex gap-2 p-2 ${styles.form}`}>
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message…"
          className={`flex-1 text-sm outline-none ${styles.input}`}
        />
        <button type="submit" className={styles.button}>
          Send
        </button>
      </form>
    </div>
  );
}
