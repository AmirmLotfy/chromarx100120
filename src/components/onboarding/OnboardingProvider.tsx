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
  const [currentStep, setCurrentStep] = useState(0);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const settings = useSettings();
  const { user } = useFirebase();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (user) {
        const onboardingStatus = localStorage.getItem("onboardingComplete");
        if (onboardingStatus === "true") {
          setIsOnboardingComplete(true);
          setCurrentStep(0);
        } else {
          setIsOnboardingComplete(false);
          setCurrentStep(1);
        }
      } else {
        // Force onboarding for non-logged in users
        setIsOnboardingComplete(false);
        setCurrentStep(1);
      }
    };

    checkOnboardingStatus();
  }, [user]);

  const completeOnboarding = () => {
    if (user) {
      localStorage.setItem("onboardingComplete", "true");
      setIsOnboardingComplete(true);
      setCurrentStep(0);
    }
  };

  const startOnboarding = () => {
    setIsOnboardingComplete(false);
    setCurrentStep(1);
  };

  const value = {
    currentStep,
    setCurrentStep,
    isOnboardingComplete,
    completeOnboarding,
    startOnboarding,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};