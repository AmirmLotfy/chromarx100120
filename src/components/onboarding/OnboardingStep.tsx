
import { LucideIcon } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

interface OnboardingStepProps {
  title: string;
  description: string;
  icon: LucideIcon | string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  content?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

const OnboardingStep = ({
  title,
  description,
  icon: Icon,
  primaryAction,
  secondaryAction,
  content,
  children,
  className,
}: OnboardingStepProps) => {
  return (
    <div className={cn("space-y-6 animate-fade-in", className)}>
      <div className="space-y-4">
        <div className="mx-auto w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/10 flex items-center justify-center animate-scale-in">
          {typeof Icon === 'string' ? (
            <img src={Icon} alt="" className="w-8 h-8 md:w-10 md:h-10" />
          ) : (
            <Icon className="w-8 h-8 md:w-10 md:h-10 text-primary" />
          )}
        </div>
        <div className="space-y-2 text-center">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
            {title}
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
            {description}
          </p>
        </div>
      </div>

      {content && (
        <div className="py-4 md:py-6 px-2 md:px-4">
          {content}
        </div>
      )}
      
      {children && (
        <div className="py-4 md:py-6">
          {children}
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 justify-center pt-4">
        {secondaryAction && (
          <Button
            variant="outline"
            onClick={secondaryAction.onClick}
            className="w-full sm:w-auto h-11 text-base"
          >
            {secondaryAction.label}
          </Button>
        )}
        {primaryAction && (
          <Button
            onClick={primaryAction.onClick}
            className="w-full sm:w-auto h-11 text-base"
          >
            {primaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
};

export default OnboardingStep;
