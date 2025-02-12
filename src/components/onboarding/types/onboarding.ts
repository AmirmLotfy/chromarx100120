
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
}

export interface OnboardingContainerProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
}

export interface OnboardingContentProps {
  currentStep: number;
  totalSteps: number;
  stepData: OnboardingStepConfig;
}

export interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}
