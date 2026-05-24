import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { convex } from "./lib/convex.ts";
import { loadFonts } from "./lib/loadFonts.ts";
import { ThemeProvider } from "./theme/ThemeProvider";
import "./index.css";

loadFonts();
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexAuthProvider client={convex}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ConvexAuthProvider>
  </StrictMode>,
);
