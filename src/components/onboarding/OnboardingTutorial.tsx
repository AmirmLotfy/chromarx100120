
import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboarding } from "./OnboardingProvider";
import { Button } from "@/components/ui/button";
import { X, ArrowRight, ArrowLeft, Bookmark, Search, Tag, FolderPlus, Globe, Sparkles } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const steps = [
  {
    title: "Welcome to ChroMarx",
    description: "Your modern bookmark manager with AI-powered organization tools.",
    icon: <Bookmark className="h-10 w-10 text-primary" />,
  },
  {
    title: "Organize with Categories",
    description: "Sort your bookmarks into categories for easy access and better organization.",
    icon: <FolderPlus className="h-10 w-10 text-primary" />,
  },
  {
    title: "Powerful Search",
    description: "Quickly find what you need with our advanced search capabilities.",
    icon: <Search className="h-10 w-10 text-primary" />,
  },
  {
    title: "AI Categorization",
    description: "Let AI help organize your bookmarks by suggesting relevant categories.",
    icon: <Sparkles className="h-10 w-10 text-primary" />,
  },
];

export function OnboardingTutorial() {
  const {
    isFirstVisit,
    currentStep,
    setCurrentStep,
    totalSteps,
    dismissOnboarding,
  } = useOnboarding();
  const isMobile = useIsMobile();

  // Close the tutorial when Escape is pressed
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        dismissOnboarding();
      }
    };

    window.addEventListener("keydown", handleEscKey);
    return () => {
      window.removeEventListener("keydown", handleEscKey);
    };
  }, [dismissOnboarding]);

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      dismissOnboarding();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isFirstVisit) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className={`relative bg-background border rounded-xl shadow-lg ${
            isMobile ? "w-[95%] max-w-md" : "w-full max-w-md"
          }`}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-8 w-8 rounded-full"
            onClick={dismissOnboarding}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>

          <div className="p-6">
            <div className="flex flex-col items-center text-center mb-6">
              {steps[currentStep].icon}
              <h2 className="text-xl font-bold mt-4 mb-2">{steps[currentStep].title}</h2>
              <p className="text-muted-foreground text-sm">
                {steps[currentStep].description}
              </p>
            </div>

            <div className="flex items-center justify-between mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="rounded-full"
              >
                <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                <span>Back</span>
              </Button>

              <div className="flex space-x-1">
                {Array.from({ length: totalSteps }).map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 w-6 rounded-full ${
                      index === currentStep
                        ? "bg-primary"
                        : "bg-primary/20"
                    }`}
                  />
                ))}
              </div>

              <Button
                variant="default"
                size="sm"
                onClick={handleNext}
                className="rounded-full"
              >
                {currentStep === totalSteps - 1 ? (
                  "Get Started"
                ) : (
                  <>
                    <span>Next</span>
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
