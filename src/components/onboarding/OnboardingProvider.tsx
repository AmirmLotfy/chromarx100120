
import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { storage } from "@/services/storageService";

interface OnboardingContextType {
  isFirstVisit: boolean;
  setFirstVisit: (value: boolean) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  totalSteps: number;
  dismissOnboarding: () => void;
  isOnboardingComplete: boolean;
  restartOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}

interface OnboardingProviderProps {
  children: React.ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  // Check if this is the first visit or if onboarding is complete
  const [isFirstVisit, setFirstVisit] = useState<boolean>(true);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const totalSteps = 4; // Total number of onboarding steps
  
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const onboardingStatus = await storage.get<{
          completed: boolean;
          firstVisitDismissed: boolean;
        }>("onboardingStatus");
        
        if (onboardingStatus) {
          setIsOnboardingComplete(onboardingStatus.completed);
          setFirstVisit(!onboardingStatus.firstVisitDismissed);
        } else {
          // If no status exists, this is the first visit
          setFirstVisit(true);
          setIsOnboardingComplete(false);
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
      }
    };
    
    checkOnboardingStatus();
  }, []);
  
  const dismissOnboarding = async () => {
    try {
      await storage.set("onboardingStatus", {
        completed: true,
        firstVisitDismissed: true
      });
      setFirstVisit(false);
      setIsOnboardingComplete(true);
    } catch (error) {
      console.error("Error saving onboarding status:", error);
    }
  };
  
  const restartOnboarding = async () => {
    try {
      await storage.set("onboardingStatus", {
        completed: false,
        firstVisitDismissed: false
      });
      setFirstVisit(true);
      setIsOnboardingComplete(false);
      setCurrentStep(0);
    } catch (error) {
      console.error("Error resetting onboarding status:", error);
    }
  };
  
  const value = {
    isFirstVisit,
    setFirstVisit,
    currentStep,
    setCurrentStep,
    totalSteps,
    dismissOnboarding,
    isOnboardingComplete,
    restartOnboarding
  };
  
  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}
