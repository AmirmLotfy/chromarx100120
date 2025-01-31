import React, { createContext, useContext, useState, useEffect } from "react";
import { useSettings } from "@/stores/settingsStore";
import { useFirebase } from "@/contexts/FirebaseContext";

interface OnboardingContextType {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  isOnboardingComplete: boolean;
  completeOnboarding: () => void;
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
  // Temporarily set to 0 and true to bypass onboarding
  const [currentStep, setCurrentStep] = useState(0);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(true);
  const settings = useSettings();
  const { user } = useFirebase();

  // Temporarily disable onboarding checks
  useEffect(() => {
    setIsOnboardingComplete(true);
    setCurrentStep(0);
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem("onboardingComplete", "true");
    setIsOnboardingComplete(true);
    setCurrentStep(0);
  };

  const startOnboarding = () => {
    // Temporarily disabled
    console.log("Onboarding temporarily disabled");
  };

  return (
    <OnboardingContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        isOnboardingComplete,
        completeOnboarding,
        startOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};