
import { OnboardingContentProps } from "./types/onboarding";
import OnboardingProgress from "./OnboardingProgress";
import OnboardingStep from "./OnboardingStep";

const OnboardingContent = ({ currentStep, totalSteps, stepData }: OnboardingContentProps) => {
  return (
    <div className="min-h-[calc(100vh-4rem)] md:min-h-0 flex flex-col">
      <OnboardingProgress currentStep={currentStep} totalSteps={totalSteps} />
      <div className="flex-1 flex items-center">
        <OnboardingStep {...stepData} />
      </div>
    </div>
  );
};

export default OnboardingContent;
