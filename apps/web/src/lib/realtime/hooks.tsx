import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { configureRealtimeClient, type RealtimeClient } from "./client.js";

type RealtimeContextValue = {
  client: RealtimeClient;
  isConnected: boolean;
};

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export type RealtimeProviderProps = {
  wsUrl: string;
  getAccessToken: () => Promise<string | null>;
  getGuestSessionId: () => string | null;
  children: ReactNode;
};

export function RealtimeProvider({
  wsUrl,
  getAccessToken,
  getGuestSessionId,
  children,
}: RealtimeProviderProps) {
  const client = useMemo(
    () => configureRealtimeClient({ wsUrl, getAccessToken, getGuestSessionId }),
    [wsUrl, getAccessToken, getGuestSessionId],
  );
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    void client.connect().then(
      () => setIsConnected(true),
      () => setIsConnected(false),
    );
  }, [client]);

  const value = useMemo(() => ({ client, isConnected }), [client, isConnected]);
  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtimeClient(): RealtimeClient {
  const ctx = useContext(RealtimeContext);
  if (!ctx) {
    throw new Error("useRealtimeClient must be used within RealtimeProvider");
  }
  return ctx.client;
}

export function useQuery<T>(
  channel: string,
  args: Record<string, unknown> | "skip",
): T | undefined {
  const client = useRealtimeClient();
  const [data, setData] = useState<T | undefined>(undefined);
  const argsKey = args === "skip" ? "skip" : JSON.stringify(args);

  useEffect(() => {
    if (args === "skip") {
      setData(undefined);
      return;
    }
    return client.subscribe(channel, args, (next) => {
      setData(next as T);
    });
  }, [client, channel, argsKey]);

  return data;
}

export function useMutation<TArgs extends Record<string, unknown>, TResult = unknown>(
  handler: string,
): (args: TArgs) => Promise<TResult> {
  const client = useRealtimeClient();
  return useCallback(
    (args: TArgs) => client.invoke(handler, args) as Promise<TResult>,
    [client, handler],
  );
}

/** Cursor-based pagination over REST — skeleton for usePaginatedQuery replacement. */
export function usePaginatedQuery<T>(
  channel: string,
  args: Record<string, unknown> | "skip",
  _options?: { initialNumItems: number },
): {
  results: T[] | undefined;
  status: "LoadingFirstPage" | "CanLoadMore" | "Exhausted";
  loadMore: (numItems: number) => void;
} {
  const data = useQuery<{ page: T[]; isDone: boolean }>(channel, args);
  const loadMoreRef = useRef<(numItems: number) => void>(() => {});

  loadMoreRef.current = (_numItems: number) => {
    // TODO: REST /query with cursor when backend pagination is wired.
  };

  if (args === "skip" || data === undefined) {
    return { results: undefined, status: "LoadingFirstPage", loadMore: loadMoreRef.current };
  }

  return {
    results: data.page,
    status: data.isDone ? "Exhausted" : "CanLoadMore",
    loadMore: loadMoreRef.current,
  };
}
