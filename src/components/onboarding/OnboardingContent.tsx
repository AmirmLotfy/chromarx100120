
import { OnboardingContentProps } from "./types/onboarding";
import OnboardingProgress from "./OnboardingProgress";
import OnboardingStep from "./OnboardingStep";

const OnboardingContent = ({ currentStep, totalSteps, stepData }: OnboardingContentProps) => {
  return (
    <>
      <OnboardingProgress currentStep={currentStep} totalSteps={totalSteps} />
      <OnboardingStep {...stepData} />
    </>
  );
};

export default OnboardingContent;
