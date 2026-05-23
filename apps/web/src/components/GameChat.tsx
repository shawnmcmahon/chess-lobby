import { useMutation, useQuery } from "convex/react";
import { useState, type FormEvent } from "react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

type GameChatProps = {
  gameId: Id<"games">;
  guestSessionId?: string;
  guestName?: string;
};

export function GameChat({ gameId, guestSessionId, guestName }: GameChatProps) {
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
    <div className="flex h-full min-h-[280px] flex-col rounded-lg border border-stone-800 bg-[#121218]">
      <div className="border-b border-stone-800 px-3 py-2 text-sm font-medium text-amber-400">
        Game chat
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
        {messages?.length === 0 && (
          <p className="text-stone-500">Say hello to your opponent.</p>
        )}
        {messages?.map((msg) => (
          <div key={msg._id} className="rounded bg-stone-900/80 px-2 py-1">
            <span className="font-medium text-amber-300/90">{msg.senderName}: </span>
            <span>{msg.body}</span>
          </div>
        ))}
      </div>
      <form onSubmit={(e) => void onSubmit(e)} className="flex gap-2 border-t border-stone-800 p-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded border border-stone-700 bg-stone-900 px-2 py-1 text-sm outline-none focus:border-amber-600"
        />
        <button
          type="submit"
          className="rounded bg-amber-600 px-3 py-1 text-sm font-medium text-stone-950 hover:bg-amber-500"
        >
          Send
        </button>
      </form>
    </div>
  );
}
