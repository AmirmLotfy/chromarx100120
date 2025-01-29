import { Button } from "@/components/ui/button";
import { useOnboarding } from "./onboarding/OnboardingProvider";
import { ArrowRight } from "lucide-react";
import { useFirebase } from "@/contexts/FirebaseContext";

const WelcomeCard = () => {
  const { isOnboardingComplete, startOnboarding } = useOnboarding();
  const { user } = useFirebase();

  if (isOnboardingComplete || user) return null;

  return (
    <div className="bg-accent rounded-lg p-4 mb-4 animate-fade-in">
      <h2 className="text-lg font-semibold mb-1">Welcome to ChroMarx!</h2>
      <p className="text-muted-foreground text-sm mb-3">
        Let's help you get started with our powerful productivity tools.
      </p>
      <Button size="sm" onClick={startOnboarding}>
        Start Tutorial
        <ArrowRight className="ml-2 h-3 w-3" />
      </Button>
    </div>
  );
};

export default WelcomeCard;