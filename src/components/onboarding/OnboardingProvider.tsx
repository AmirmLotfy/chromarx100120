import React, { createContext, useContext, useState, useEffect } from "react";
import { useSettings } from "@/stores/settingsStore";
import { useFirebase } from "@/contexts/FirebaseContext";
import { toast } from "sonner";

interface OnboardingContextType {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  isOnboardingComplete: boolean;
  completeOnboarding: () => void;
  startOnboarding: () => void;
  skipOnboarding: () => void;
  resumeOnboarding: () => void;
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
    const initOnboarding = async () => {
      try {
        const onboardingStatus = await chrome.storage.sync.get(['onboardingStatus']);
        if (onboardingStatus.onboardingComplete === true) {
          setIsOnboardingComplete(true);
          setCurrentStep(0);
        } else if (onboardingStatus.lastStep) {
          // Resume from last saved step
          setCurrentStep(onboardingStatus.lastStep);
          setIsOnboardingComplete(false);
        }
      } catch (error) {
        console.error('Error initializing onboarding:', error);
      }
    };

    initOnboarding();
  }, []);

  const completeOnboarding = async () => {
    try {
      await chrome.storage.sync.set({
        onboardingStatus: {
          onboardingComplete: true,
          completedAt: new Date().toISOString()
        }
      });
      setIsOnboardingComplete(true);
      setCurrentStep(0);
      toast.success("Welcome to ChroMarx! 🎉");
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error("Failed to save onboarding status");
    }
  };

  const startOnboarding = () => {
    setIsOnboardingComplete(false);
    setCurrentStep(1);
  };

  const skipOnboarding = async () => {
    try {
      await chrome.storage.sync.set({
        onboardingStatus: {
          onboardingComplete: true,
          skippedAt: new Date().toISOString()
        }
      });
      setIsOnboardingComplete(true);
      setCurrentStep(0);
      toast.success("You can always access features through the settings menu");
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      toast.error("Failed to skip onboarding");
    }
  };

  const resumeOnboarding = () => {
    setIsOnboardingComplete(false);
  };

  // Save current step to storage when it changes
  useEffect(() => {
    if (currentStep > 0) {
      chrome.storage.sync.set({
        onboardingStatus: {
          lastStep: currentStep,
          updatedAt: new Date().toISOString()
        }
      }).catch(error => {
        console.error('Error saving onboarding step:', error);
      });
    }
  }, [currentStep]);

  const value = {
    currentStep,
    setCurrentStep,
    isOnboardingComplete,
    completeOnboarding,
    startOnboarding,
    skipOnboarding,
    resumeOnboarding,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};