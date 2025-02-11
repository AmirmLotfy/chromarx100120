
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useChromeAuth } from "@/contexts/ChromeAuthContext";

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
  const [currentStep, setCurrentStep] = useState(1);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const { user } = useChromeAuth();

  // Check onboarding status whenever user state changes
  useEffect(() => {
    console.log('Checking onboarding status, user:', user);
    const onboardingStatus = localStorage.getItem("onboardingComplete");
    
    if (user && onboardingStatus === "true") {
      console.log('User exists and onboarding is complete');
      setIsOnboardingComplete(true);
      setCurrentStep(0);
    } else {
      console.log('Onboarding incomplete or no user');
      setIsOnboardingComplete(false);
      setCurrentStep(1);
    }
  }, [user]);

  const completeOnboarding = () => {
    if (user) {
      console.log('Completing onboarding for user:', user);
      localStorage.setItem("onboardingComplete", "true");
      setIsOnboardingComplete(true);
      setCurrentStep(0);
    } else {
      console.warn('Attempted to complete onboarding without user');
    }
  };

  const startOnboarding = () => {
    console.log('Starting onboarding');
    localStorage.setItem("onboardingComplete", "false");
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
