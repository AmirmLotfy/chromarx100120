import { Navigate } from "react-router-dom";
import { useFirebase } from "@/contexts/FirebaseContext";
import { useOnboarding } from "../onboarding/OnboardingProvider";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user } = useFirebase();
  const { isOnboardingComplete } = useOnboarding();

  if (!user || !isOnboardingComplete) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;