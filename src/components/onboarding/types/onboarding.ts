
import { LucideIcon } from "lucide-react";

export interface OnboardingAction {
  label: string;
  onClick: () => void;
}

export interface OnboardingStepConfig {
  title: string;
  description: string;
  icon: LucideIcon | string;
  content?: React.ReactNode;
  primaryAction?: OnboardingAction;
  secondaryAction?: OnboardingAction;
}

export interface OnboardingContainerProps {
  children: React.ReactNode;
}

export interface OnboardingContentProps {
  currentStep: number;
  totalSteps: number;
  stepData: OnboardingStepConfig;
}
