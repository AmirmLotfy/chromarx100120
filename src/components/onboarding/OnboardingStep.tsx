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
  children?: React.ReactNode;
  className?: string;
}

const OnboardingStep = ({
  title,
  description,
  icon: Icon,
  primaryAction,
  secondaryAction,
  children,
  className,
}: OnboardingStepProps) => {
  return (
    <div className={cn("space-y-6 animate-fade-in", className)}>
      <div className="space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          {typeof Icon === 'string' ? (
            <img src={Icon} alt="" className="w-8 h-8 animate-spin" />
          ) : (
            <Icon className="w-8 h-8 text-primary" />
          )}
        </div>
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>

      {children && <div className="py-4">{children}</div>}

      <div className="flex flex-col gap-2 sm:flex-row sm:gap-4 justify-center">
        {secondaryAction && (
          <Button
            variant="outline"
            onClick={secondaryAction.onClick}
            className="w-full sm:w-auto"
          >
            {secondaryAction.label}
          </Button>
        )}
        {primaryAction && (
          <Button
            onClick={primaryAction.onClick}
            className="w-full sm:w-auto"
          >
            {primaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
};

export default OnboardingStep;