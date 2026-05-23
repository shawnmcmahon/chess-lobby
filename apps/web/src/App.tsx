import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";
import { Dashboard } from "@/pages/Dashboard";
import { Game } from "@/pages/Game";
import { JoinGame } from "@/pages/JoinGame";
import { Landing } from "@/pages/Landing";
import { Login } from "@/pages/Login";
import { Profile } from "@/pages/Profile";
import { ProfileSetup } from "@/pages/ProfileSetup";
import { GameReview } from "@/pages/GameReview";
import { PublicProfile } from "@/pages/PublicProfile";
import { Leaderboard } from "@/pages/Leaderboard";

export default function App() {
  return (
    <BrowserRouter>
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
          <Route
            path="player/:userId"
            element={<PublicProfile />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
