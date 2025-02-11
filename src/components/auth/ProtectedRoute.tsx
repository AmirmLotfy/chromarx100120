
import { Navigate, useLocation } from "react-router-dom";
import { useChromeAuth } from "@/contexts/ChromeAuthContext";
import { useOnboarding } from "../onboarding/OnboardingProvider";
import { toast } from "sonner";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useChromeAuth();
  const { isOnboardingComplete } = useOnboarding();
  const location = useLocation();

  // Show loading state while checking auth
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // If not authenticated, redirect to home with a message
  if (!user) {
    toast.error("Please sign in to access this feature");
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // If onboarding is not complete, show message and redirect
  if (!isOnboardingComplete) {
    toast.error("Please complete the onboarding first");
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
