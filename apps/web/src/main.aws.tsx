/**
 * Example entry point for the AWS backend rewrite.
 * Swap main.tsx imports to use this file when VITE_WS_URL is configured.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { loadFonts } from "./lib/loadFonts.ts";
import { ThemeProvider } from "./theme/ThemeProvider";
import { RealtimeProvider } from "./lib/realtime/hooks.tsx";
import { getAccessToken } from "./lib/realtime/auth.ts";
import { getGuestSessionId } from "./lib/guestSession.ts";
import "./index.css";

const wsUrl = import.meta.env.VITE_WS_URL as string | undefined;

if (!wsUrl) {
  console.warn(
    "VITE_WS_URL is not set. The AWS rewrite entry expects a WebSocket API URL.",
  );
}

loadFonts();
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RealtimeProvider
      wsUrl={wsUrl ?? "wss://placeholder.example.com/ws"}
      getAccessToken={getAccessToken}
      getGuestSessionId={getGuestSessionId}
    >
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </RealtimeProvider>
  </StrictMode>,
);
