import { Button } from "@/components/ui/button";
import { useOnboarding } from "./onboarding/OnboardingProvider";
import { ArrowRight } from "lucide-react";
import { useFirebase } from "@/contexts/FirebaseContext";

const WelcomeCard = () => {
  const { isOnboardingComplete, startOnboarding } = useOnboarding();
  const { user } = useFirebase();

  if (isOnboardingComplete || user) return null;

  return (
    <div className="bg-accent rounded-lg p-6 mb-4 animate-fade-in">
      <h2 className="text-xl font-semibold mb-2">Welcome to ChroMarx!</h2>
      <p className="text-muted-foreground mb-4">
        Let's help you get started with our powerful productivity tools.
      </p>
      <Button onClick={startOnboarding} className="w-full md:w-auto py-6 text-lg">
        Start Setup
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  );
};

export default WelcomeCard;