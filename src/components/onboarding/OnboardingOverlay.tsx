import React from "react";
import { useOnboarding } from "./OnboardingProvider";
import { useChromeAuth } from "@/contexts/ChromeAuthContext";
import OnboardingStep from "./OnboardingStep";
import OnboardingProgress from "./OnboardingProgress";

const OnboardingOverlay = () => {
  const { currentStep, isOnboardingComplete } = useOnboarding();
  const { user } = useChromeAuth();
  const totalSteps = 3; // Assuming 3 steps in the onboarding process

  if (isOnboardingComplete || user) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <OnboardingProgress currentStep={currentStep} totalSteps={totalSteps} />
        <OnboardingStep 
          title="Welcome"
          description="Let's get you started"
          content="Follow these steps to set up your account"
          icon={() => null}
        />
      </div>
    </div>
  );
};

export default OnboardingOverlay;