
import React from "react";
import { OnboardingProvider } from "./OnboardingProvider";
import { OnboardingTutorial } from "./OnboardingTutorial";

interface AppOnboardingProps {
  children: React.ReactNode;
}

export function AppOnboarding({ children }: AppOnboardingProps) {
  return (
    <OnboardingProvider>
      {children}
      <OnboardingTutorial />
    </OnboardingProvider>
  );
}
