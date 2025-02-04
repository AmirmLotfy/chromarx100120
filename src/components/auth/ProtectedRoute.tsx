import { Navigate } from "react-router-dom";
import { useChromeAuth } from "@/contexts/ChromeAuthContext";
import { useOnboarding } from "../onboarding/OnboardingProvider";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user } = useChromeAuth();
  const { isOnboardingComplete } = useOnboarding();

  if (!user || !isOnboardingComplete) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;