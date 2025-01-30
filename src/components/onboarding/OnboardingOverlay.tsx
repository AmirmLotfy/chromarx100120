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
import { Check, ArrowRight, Info } from "lucide-react";
import { toast } from "sonner";
import { useFirebase } from "@/contexts/FirebaseContext";
import { subscriptionPlans } from "@/config/subscriptionPlans";
import { ChromeBookmark } from "@/types/bookmark";

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
  const [importedBookmarks, setImportedBookmarks] = React.useState<ChromeBookmark[]>([]);

  if (currentStep === 0) return null;

  const currentStepData = onboardingSteps[currentStep - 1];
  const isLastStep = currentStep === onboardingSteps.length;
  const progress = (currentStep / onboardingSteps.length) * 100;

  const handleImportBookmarks = async () => {
    if (!chrome?.bookmarks) {
      toast.error("Bookmark import is only available in the Chrome extension");
      return;
    }

    try {
      const bookmarks = await chrome.bookmarks.getTree();
      setImportedBookmarks(bookmarks);
      toast.success("Bookmarks imported successfully!");
      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error("Error importing bookmarks:", error);
      toast.error("Failed to import bookmarks. Please try again.");
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
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
      <Card className="w-full max-w-md mx-auto my-4">
        <CardHeader>
          <div className="w-full bg-muted rounded-full h-2 mb-4">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
            {currentStepData.title}
            <Info className="h-5 w-5 text-muted-foreground" />
          </CardTitle>
          <CardDescription className="text-base md:text-lg">
            {currentStepData.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {currentStep === 4 && (
            <div className="grid gap-4">
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

        <CardFooter>
          <Button 
            onClick={handleNext} 
            className="w-full py-6 text-lg"
          >
            {currentStepData.requiresAuth && !user ? (
              "Sign in to Continue"
            ) : currentStep === 3 ? (
              "Import Bookmarks"
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