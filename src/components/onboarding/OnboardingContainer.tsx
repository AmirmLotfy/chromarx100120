
import { OnboardingContainerProps } from "./types/onboarding";
import OnboardingProgress from "./OnboardingProgress";

const OnboardingContainer = ({ children, currentStep, totalSteps, onClose }: OnboardingContainerProps) => {
  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card w-full max-w-3xl min-h-[80vh] md:min-h-0 rounded-xl border shadow-lg p-6 sm:p-8 m-4 sm:m-8 flex flex-col">
        <OnboardingProgress currentStep={currentStep} totalSteps={totalSteps} />
        <div className="flex-1 flex flex-col justify-center">
          {children}
        </div>
      </div>
    </div>
  );
};

export default OnboardingContainer;
