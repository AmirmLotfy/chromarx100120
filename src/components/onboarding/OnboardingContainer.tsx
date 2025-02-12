
import { OnboardingContainerProps } from "./types/onboarding";
import { X } from "lucide-react";
import { Button } from "../ui/button";

const OnboardingContainer = ({ children, currentStep, totalSteps, onClose }: OnboardingContainerProps) => {
  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-start md:items-center justify-center overflow-hidden">
      <div className="relative bg-card w-full max-w-3xl h-[100vh] md:h-auto md:max-h-[90vh] md:rounded-xl border shadow-lg flex flex-col">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-10"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
        
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default OnboardingContainer;
