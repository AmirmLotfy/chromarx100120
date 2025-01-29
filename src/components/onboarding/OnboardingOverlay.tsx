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

const onboardingSteps = [
  {
    title: "Welcome to ChroMarx!",
    description: "Your all-in-one browser productivity companion. Let's get you started!",
    content: "ChroMarx helps you manage bookmarks, track time, take notes, and boost your productivity.",
  },
  {
    title: "Smart Bookmarking",
    description: "Organize your bookmarks intelligently",
    content: "Save, categorize, and search through your bookmarks with ease. AI-powered features help you stay organized.",
  },
  {
    title: "Time Management",
    description: "Track and optimize your time",
    content: "Use the Pomodoro timer, track your productivity, and get insights into your browsing habits.",
  },
  {
    title: "Tasks & Notes",
    description: "Stay organized and productive",
    content: "Create tasks, take notes, and keep everything synchronized across your devices.",
  },
  {
    title: "Ready to Start!",
    description: "You're all set to boost your productivity",
    content: "Explore ChroMarx's features and make the most of your browsing experience.",
  },
];

export const OnboardingOverlay = () => {
  const { currentStep, setCurrentStep, completeOnboarding, skipOnboarding } = useOnboarding();

  if (currentStep === 0) return null;

  const currentStepData = onboardingSteps[currentStep - 1];
  const isLastStep = currentStep === onboardingSteps.length;

  const handleNext = () => {
    if (isLastStep) {
      completeOnboarding();
      toast.success("Welcome to ChroMarx! 🎉");
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    skipOnboarding();
    toast.info("You can always access the tutorial from settings");
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentStepData.title}
            <Info className="h-5 w-5 text-muted-foreground" />
          </CardTitle>
          <CardDescription>{currentStepData.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{currentStepData.content}</p>
          <div className="mt-4 flex justify-center gap-2">
            {Array.from({ length: onboardingSteps.length }).map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index + 1 === currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="ghost" onClick={handleSkip}>
            <SkipForward className="mr-2 h-4 w-4" />
            Skip Tutorial
          </Button>
          <Button onClick={handleNext}>
            {isLastStep ? (
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