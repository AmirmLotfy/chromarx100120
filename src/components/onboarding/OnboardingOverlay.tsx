import React from "react";
import { useOnboarding } from "./OnboardingProvider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Check, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useFirebase } from "@/contexts/FirebaseContext";
import OnboardingProgress from "./OnboardingProgress";
import OnboardingStep from "./OnboardingStep";
import WelcomeStep from "./steps/WelcomeStep";

const onboardingSteps = [
  {
    component: WelcomeStep,
    requiresAuth: false,
  },
  {
    title: "Sign in to Get Started",
    description: "Secure your data and sync across devices",
    content: "Sign in with your Google account to unlock all features and keep your data synced.",
    icon: Check,
    requiresAuth: true,
  },
  {
    title: "Import Your Bookmarks",
    description: "Bring your existing bookmarks",
    content: "Select the bookmark folders you'd like to import to ChroMarx.",
    icon: BookmarkIcon,
    requiresAuth: true,
  },
  {
    title: "Discover Key Features",
    description: "Explore what ChroMarx can do for you",
    content: "Let's walk through the main features that will boost your productivity.",
    icon: NotebookPen,
    requiresAuth: true,
  },
  {
    title: "Choose Your Plan",
    description: "Select the perfect plan for your needs",
    content: "Pick a subscription plan that matches your productivity goals.",
    icon: Check,
    requiresAuth: true,
  },
  {
    title: "Ready to Start!",
    description: "You're all set to boost your productivity",
    content: "Start exploring ChroMarx's powerful features and make the most of your browsing.",
    icon: Check,
    requiresAuth: true,
  }
];

export const OnboardingOverlay = () => {
  const { currentStep, setCurrentStep, completeOnboarding, isOnboardingComplete } = useOnboarding();
  const { user, signInWithGoogle } = useFirebase();

  // Show onboarding if not completed and user is not logged in
  if (isOnboardingComplete || (user && currentStep === 0)) return null;

  const currentStepData = onboardingSteps[currentStep - 1];
  const isLastStep = currentStep === onboardingSteps.length;
  const StepComponent = currentStepData?.component || WelcomeStep;

  const handleNext = async () => {
    if (currentStepData?.requiresAuth && !user) {
      try {
        await signInWithGoogle();
      } catch (error) {
        toast.error("Please sign in to continue");
        return;
      }
    }

    if (isLastStep) {
      completeOnboarding();
      toast.success("Welcome to ChroMarx! 🎉");
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <OnboardingProgress 
            currentStep={currentStep} 
            totalSteps={onboardingSteps.length} 
          />
        </CardHeader>
        
        <CardContent>
          <StepComponent />
        </CardContent>

        <CardFooter className="flex justify-between items-center">
          <Button 
            variant="ghost"
            onClick={() => setCurrentStep(currentStep - 1)}
            disabled={currentStep === 1}
          >
            Back
          </Button>
          <Button onClick={handleNext}>
            {currentStepData?.requiresAuth && !user ? (
              "Sign in to Continue"
            ) : isLastStep ? (
              <>
                Get Started
                <Check className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
