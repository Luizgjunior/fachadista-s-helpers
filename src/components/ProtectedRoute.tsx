import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import type { Profile } from "@/hooks/useAuth";
import type { User } from "@supabase/supabase-js";

interface ProtectedRouteProps {
  user: User | null;
  loading: boolean;
  children: React.ReactNode;
}

interface AdminRouteProps extends ProtectedRouteProps {
  profile: Profile | null;
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function ProtectedRoute({ user, loading, children }: ProtectedRouteProps) {
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function AdminRoute({ user, profile, loading, children }: AdminRouteProps) {
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!profile?.is_admin) {
    toast.error("Acesso restrito");
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
