import React, { useState } from "react";
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
import { Check, ArrowRight, Info } from "lucide-react";
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
    title: "Import Your Bookmarks",
    description: "Bring your existing bookmarks",
    content: "Import your Chrome bookmarks to get started quickly with ChroMarx.",
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
  const { currentStep, setCurrentStep, completeOnboarding } = useOnboarding();
  const { user, signInWithGoogle } = useFirebase();
  const [isImporting, setIsImporting] = useState(false);

  if (currentStep === 0) return null;

  const currentStepData = onboardingSteps[currentStep - 1];
  const isLastStep = currentStep === onboardingSteps.length;
  const progress = (currentStep / onboardingSteps.length) * 100;

  const handleImportBookmarks = async () => {
    if (!chrome?.bookmarks) {
      toast.error("Bookmark import is only available in Chrome");
      return;
    }

    setIsImporting(true);
    try {
      const bookmarks = await chrome.bookmarks.getTree();
      console.log("Imported bookmarks:", bookmarks);
      toast.success("Bookmarks imported successfully!");
      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error("Error importing bookmarks:", error);
      toast.error("Failed to import bookmarks. Please try again.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleNext = async () => {
    if (currentStepData.requiresAuth && !user) {
      try {
        await signInWithGoogle();
      } catch (error) {
        toast.error("Please sign in to continue");
        return;
      }
    }

    if (currentStep === 3) {
      // Bookmark import step
      await handleImportBookmarks();
      return;
    }

    if (isLastStep) {
      completeOnboarding();
      toast.success("Welcome to ChroMarx! 🎉");
    } else {
      setCurrentStep(currentStep + 1);
    }
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
          <CardTitle className="flex items-center gap-2 text-2xl md:text-3xl">
            {currentStepData.title}
            <Info className="h-5 w-5 text-muted-foreground" />
          </CardTitle>
          <CardDescription className="text-lg md:text-xl">
            {currentStepData.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {currentStep === 4 && (
            <div className="grid md:grid-cols-3 gap-4">
              {subscriptionPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`p-6 rounded-lg border ${
                    plan.isPopular ? "border-primary" : "border-border"
                  } hover:shadow-lg transition-shadow duration-200`}
                >
                  <h3 className="font-semibold text-lg md:text-xl">{plan.name}</h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    {plan.description}
                  </p>
                  <div className="mt-4">
                    <span className="text-2xl font-bold">${plan.pricing.monthly}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-muted-foreground text-base md:text-lg">
            {currentStepData.content}
          </p>
        </CardContent>

        <CardFooter className="flex justify-end">
          <Button 
            onClick={handleNext}
            size="lg"
            className="min-w-[120px] text-base md:text-lg py-6"
            disabled={isImporting}
          >
            {currentStepData.requiresAuth && !user ? (
              "Sign in to Continue"
            ) : isLastStep ? (
              <>
                Get Started
                <Check className="ml-2 h-5 w-5" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};