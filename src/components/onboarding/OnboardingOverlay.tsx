import React from "react";
import { useOnboarding } from "./OnboardingProvider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, ArrowRight, Info, SkipForward } from "lucide-react";
import { toast } from "sonner";
import { useFirebase } from "@/contexts/FirebaseContext";
import { subscriptionPlans } from "@/config/subscriptionPlans";

const onboardingSteps = [
  {
    title: "Welcome to ChroMarx!",
    description: "Your all-in-one browser productivity companion",
    content: "Let's get you set up with ChroMarx to enhance your browsing experience.",
    requiresAuth: false,
  },
  {
    title: "Sign in to Get Started",
    description: "Secure your data and sync across devices",
    content: "Sign in with your Google account to unlock all features and keep your data synced across devices.",
    requiresAuth: true,
  },
  {
    title: "Choose Your Plan",
    description: "Select the perfect plan for your needs",
    content: "Pick a subscription plan that matches your productivity goals.",
    requiresAuth: true,
  },
  {
    title: "Ready to Start!",
    description: "You're all set to boost your productivity",
    content: "Start exploring ChroMarx's powerful features and make the most of your browsing experience.",
    requiresAuth: true,
  },
];

export const OnboardingOverlay = () => {
  const { currentStep, setCurrentStep, completeOnboarding, skipOnboarding } = useOnboarding();
  const { user, signInWithGoogle } = useFirebase();

  if (currentStep === 0) return null;

  const currentStepData = onboardingSteps[currentStep - 1];
  const isLastStep = currentStep === onboardingSteps.length;
  const progress = (currentStep / onboardingSteps.length) * 100;

  const handleNext = async () => {
    if (currentStepData.requiresAuth && !user) {
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

  const handleSkip = () => {
    if (!user) {
      toast.error("Please sign in to continue using ChroMarx");
      return;
    }
    skipOnboarding();
    toast.info("You can always access the tutorial from settings");
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="w-full bg-muted rounded-full h-2 mb-4">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <CardTitle className="flex items-center gap-2 text-2xl">
            {currentStepData.title}
            <Info className="h-5 w-5 text-muted-foreground" />
          </CardTitle>
          <CardDescription className="text-lg">{currentStepData.description}</CardDescription>
        </CardHeader>
        
        <CardContent>
          {currentStep === 3 && (
            <div className="grid md:grid-cols-3 gap-4">
              {subscriptionPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`p-4 rounded-lg border ${
                    plan.isPopular ? "border-primary" : "border-border"
                  }`}
                >
                  <h3 className="font-semibold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                  <div className="mt-2">
                    <span className="text-xl font-bold">${plan.pricing.monthly}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-muted-foreground mt-4">{currentStepData.content}</p>
        </CardContent>

        <CardFooter className="flex justify-between">
          {!currentStepData.requiresAuth && (
            <Button variant="ghost" onClick={handleSkip}>
              <SkipForward className="mr-2 h-4 w-4" />
              Skip Tutorial
            </Button>
          )}
          <Button onClick={handleNext} className="ml-auto">
            {currentStepData.requiresAuth && !user ? (
              "Sign in to Continue"
            ) : isLastStep ? (
              <>
                Get Started
                <Check className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};