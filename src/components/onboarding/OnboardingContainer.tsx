
import { OnboardingContainerProps } from "./types/onboarding";

const OnboardingContainer = ({ children, currentStep, totalSteps }: OnboardingContainerProps) => {
  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto">
      <div className="relative bg-card w-full max-w-3xl min-h-[500px] md:min-h-0 md:max-h-[90vh] md:rounded-xl border shadow-lg flex flex-col my-4 md:my-0">
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default OnboardingContainer;
