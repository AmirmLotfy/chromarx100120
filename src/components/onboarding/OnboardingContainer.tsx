
import { OnboardingContainerProps } from "./types/onboarding";

const OnboardingContainer = ({ children }: OnboardingContainerProps) => {
  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-start md:items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card w-full max-w-4xl rounded-lg border shadow-lg p-4 sm:p-6 space-y-6 my-4 sm:my-8">
        {children}
      </div>
    </div>
  );
};

export default OnboardingContainer;
