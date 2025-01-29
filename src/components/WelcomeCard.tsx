import { Button } from "@/components/ui/button";
import { useOnboarding } from "./onboarding/OnboardingProvider";
import { ArrowRight } from "lucide-react";

const WelcomeCard = () => {
  const { isOnboardingComplete, startOnboarding } = useOnboarding();

  if (isOnboardingComplete) return null;

  return (
    <div className="bg-accent rounded-lg p-6 mb-6 animate-fade-in">
      <h2 className="text-xl font-semibold mb-2">Welcome to ChroMarx!</h2>
      <p className="text-muted-foreground mb-4">
        Let's help you get started with our powerful productivity tools.
      </p>
      <Button onClick={startOnboarding}>
        Start Tutorial
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
};

export default WelcomeCard;