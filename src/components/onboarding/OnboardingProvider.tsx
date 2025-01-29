import React, { createContext, useContext, useState, useEffect } from "react";
import { useSettings } from "@/stores/settingsStore";

interface OnboardingContextType {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  isOnboardingComplete: boolean;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
  startOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
};

export const OnboardingProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const settings = useSettings();

  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem("onboardingComplete");
    if (hasCompletedOnboarding) {
      setIsOnboardingComplete(true);
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem("onboardingComplete", "true");
    setIsOnboardingComplete(true);
    setCurrentStep(0);
  };

  const skipOnboarding = () => {
    completeOnboarding();
  };

  const startOnboarding = () => {
    setCurrentStep(1);
  };

  return (
    <OnboardingContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        isOnboardingComplete,
        completeOnboarding,
        skipOnboarding,
        startOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};