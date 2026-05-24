import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";
import { Landing } from "@/pages/Landing";

const Dashboard = lazy(() =>
  import("@/pages/Dashboard").then((m) => ({ default: m.Dashboard })),
);
const Game = lazy(() => import("@/pages/Game").then((m) => ({ default: m.Game })));
const JoinGame = lazy(() =>
  import("@/pages/JoinGame").then((m) => ({ default: m.JoinGame })),
);
const Login = lazy(() => import("@/pages/Login").then((m) => ({ default: m.Login })));
const Profile = lazy(() =>
  import("@/pages/Profile").then((m) => ({ default: m.Profile })),
);
const ProfileSetup = lazy(() =>
  import("@/pages/ProfileSetup").then((m) => ({ default: m.ProfileSetup })),
);
const GameReview = lazy(() =>
  import("@/pages/GameReview").then((m) => ({ default: m.GameReview })),
);
const PublicProfile = lazy(() =>
  import("@/pages/PublicProfile").then((m) => ({ default: m.PublicProfile })),
);
const Leaderboard = lazy(() =>
  import("@/pages/Leaderboard").then((m) => ({ default: m.Leaderboard })),
);

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm opacity-70">
      Loading…
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Landing />} />
            <Route path="login" element={<Login />} />
            <Route path="game/join/:inviteToken" element={<JoinGame />} />
            <Route path="game/:gameId" element={<Game />} />
            <Route
              path="game/:gameId/review"
              element={
                <AuthGuard>
                  <GameReview />
                </AuthGuard>
              }
            />
            <Route
              path="profile/setup"
              element={
                <AuthGuard>
                  <ProfileSetup />
                </AuthGuard>
              }
            />
            <Route
              path="profile"
              element={
                <AuthGuard>
                  <Profile />
                </AuthGuard>
              }
            />
            <Route
              path="dashboard"
              element={
                <AuthGuard>
                  <Dashboard />
                </AuthGuard>
              }
            />
            <Route
              path="leaderboard"
              element={
                <AuthGuard>
                  <Leaderboard />
                </AuthGuard>
              }
            />
            <Route path="player/:userId" element={<PublicProfile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
