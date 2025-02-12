
interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

const OnboardingProgress = ({ currentStep, totalSteps }: OnboardingProgressProps) => {
  return (
    <div className="w-full space-y-2 mb-8 sticky top-0 bg-card/50 backdrop-blur-sm pt-2">
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>Step {currentStep} of {totalSteps}</span>
        <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-500 ease-in-out"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default OnboardingProgress;
