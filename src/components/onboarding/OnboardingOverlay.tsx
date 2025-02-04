import React from "react";
import { useOnboarding } from "./OnboardingProvider";
import { useChromeAuth } from "@/contexts/ChromeAuthContext";
import OnboardingStep from "./OnboardingStep";
import OnboardingProgress from "./OnboardingProgress";
import { Sparkles } from "lucide-react";

const OnboardingOverlay = () => {
  const { currentStep, isOnboardingComplete } = useOnboarding();
  const { user } = useChromeAuth();
  const totalSteps = 3;

  // Show overlay for non-logged in users or if onboarding is not complete
  if (user && isOnboardingComplete) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg max-w-md w-full">
        <OnboardingProgress currentStep={currentStep} totalSteps={totalSteps} />
        <OnboardingStep 
          title="Welcome"
          description="Let's get you started"
          content="Follow these steps to set up your account"
          icon={Sparkles}
        />
      </div>
    </div>
  );
};

export default OnboardingOverlay;