import { Button } from "@/components/ui/button";
import { useOnboarding } from "./onboarding/OnboardingProvider";
import { ArrowRight, Sparkles } from "lucide-react";
import { useFirebase } from "@/contexts/FirebaseContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const WelcomeCard = () => {
  const { isOnboardingComplete, startOnboarding } = useOnboarding();
  const { user } = useFirebase();

  // Don't render if onboarding is complete or user is signed in
  if (isOnboardingComplete || user) return null;

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 border-none shadow-lg animate-fade-in">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          Welcome to ChroMarx!
          <Sparkles className="h-6 w-6 text-primary animate-pulse" />
        </CardTitle>
        <CardDescription className="text-base md:text-lg">
          Your all-in-one browser companion for enhanced productivity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          Let's help you get started with our powerful productivity tools:
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Smart bookmark organization
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            AI-powered summarization
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Productivity analytics
          </li>
        </ul>
        <Button 
          onClick={startOnboarding}
          size="lg"
          className="w-full md:w-auto text-base group hover:shadow-md transition-all duration-300"
        >
          Start Setup
          <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default WelcomeCard;