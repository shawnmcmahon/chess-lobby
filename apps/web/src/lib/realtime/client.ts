import type { ClientMessage, ServerMessage, SubscriptionKey } from "./types.js";
import { subscriptionKey } from "./types.js";

type Listener = (data: unknown) => void;

export type RealtimeClientOptions = {
  wsUrl: string;
  getAccessToken: () => Promise<string | null>;
  getGuestSessionId: () => string | null;
};

export class RealtimeClient {
  private ws: WebSocket | null = null;
  private listeners = new Map<SubscriptionKey, Set<Listener>>();
  private pendingInvokes = new Map<
    string,
    { resolve: (value: unknown) => void; reject: (error: Error) => void }
  >();
  private connectPromise: Promise<void> | null = null;

  constructor(private readonly options: RealtimeClientOptions) {}

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    if (this.connectPromise) return this.connectPromise;

    this.connectPromise = new Promise<void>((resolve, reject) => {
      const tokenPromise = this.options.getAccessToken();
      const guestSessionId = this.options.getGuestSessionId();
      void tokenPromise.then((token) => {
        const url = new URL(this.options.wsUrl);
        if (token) url.searchParams.set("token", token);
        if (guestSessionId) url.searchParams.set("guestSessionId", guestSessionId);

        const ws = new WebSocket(url.toString());
        this.ws = ws;

        ws.onopen = () => {
          this.connectPromise = null;
          resolve();
        };
        ws.onerror = () => {
          this.connectPromise = null;
          reject(new Error("WebSocket connection failed"));
        };
        ws.onclose = () => {
          this.ws = null;
          this.connectPromise = null;
        };
        ws.onmessage = (event) => {
          this.handleMessage(JSON.parse(String(event.data)) as ServerMessage);
        };
      });
    });

    return this.connectPromise;
  }

  subscribe(channel: string, args: Record<string, unknown>, listener: Listener): () => void {
    const key = subscriptionKey(channel, args);
    const set = this.listeners.get(key) ?? new Set();
    set.add(listener);
    this.listeners.set(key, set);

    void this.connect().then(() => {
      this.send({ type: "subscribe", channel, args });
    });

    return () => {
      set.delete(listener);
      if (set.size === 0) {
        this.listeners.delete(key);
        this.send({ type: "unsubscribe", channel, args });
      }
    };
  }

  async invoke(handler: string, args: Record<string, unknown>): Promise<unknown> {
    await this.connect();
    const requestId = crypto.randomUUID();

    return new Promise((resolve, reject) => {
      this.pendingInvokes.set(requestId, { resolve, reject });
      this.send({ type: "invoke", handler, args, requestId });
    });
  }

  private send(message: ClientMessage): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(message));
  }

  private handleMessage(message: ServerMessage): void {
    if (message.type === "subscribed" || message.type === "update") {
      const key = subscriptionKey(message.channel, message.args);
      const listeners = this.listeners.get(key);
      listeners?.forEach((listener) => listener(message.data));
      return;
    }

    if (message.type === "invoke_result") {
      const pending = this.pendingInvokes.get(message.requestId);
      if (!pending) return;
      this.pendingInvokes.delete(message.requestId);
      if (message.ok) {
        pending.resolve(message.data);
      } else {
        pending.reject(new Error(message.error));
      }
      return;
    }

    if (message.type === "error") {
      console.error("[realtime]", message.message);
    }
  }
}

let sharedClient: RealtimeClient | null = null;

export function getRealtimeClient(): RealtimeClient {
  if (!sharedClient) {
    const wsUrl = import.meta.env.VITE_WS_URL as string | undefined;
    if (!wsUrl) {
      console.warn("VITE_WS_URL is not set — realtime client uses placeholder URL.");
    }
    sharedClient = new RealtimeClient({
      wsUrl: wsUrl ?? "wss://placeholder.example.com/ws",
      getAccessToken: async () => null,
      getGuestSessionId: () => null,
    });
  }
  return sharedClient;
}

export function configureRealtimeClient(options: RealtimeClientOptions): RealtimeClient {
  sharedClient = new RealtimeClient(options);
  return sharedClient;
}
