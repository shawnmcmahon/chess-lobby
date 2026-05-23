import { useConvexAuth } from "convex/react";
import { useMutation, useQuery } from "convex/react";
import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api } from "../../../../convex/_generated/api";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const location = useLocation();
  const user = useQuery(api.users.current, isAuthenticated ? {} : "skip");
  const syncProfile = useMutation(api.users.syncProfile);

  useEffect(() => {
    if (isAuthenticated) {
      void syncProfile().catch(() => undefined);
    }
  }, [isAuthenticated, syncProfile]);

  if (isLoading || (isAuthenticated && user === undefined)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-stone-400">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user && !user.profileComplete && location.pathname !== "/profile/setup") {
    return <Navigate to="/profile/setup" replace />;
  }

  return <>{children}</>;
}
