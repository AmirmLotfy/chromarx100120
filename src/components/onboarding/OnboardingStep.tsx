
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
    <div className={cn("space-y-8 animate-fade-in px-4 sm:px-6", className)}>
      <div className="space-y-6">
        <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-scale-in">
          {typeof Icon === 'string' ? (
            <img src={Icon} alt="" className="w-10 h-10" />
          ) : (
            <Icon className="w-10 h-10 text-primary" />
          )}
        </div>
        <div className="space-y-3 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">{title}</h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto">{description}</p>
        </div>
      </div>

      {content && <div className="py-6">{content}</div>}
      {children && <div className="py-6">{children}</div>}

      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 justify-center">
        {secondaryAction && (
          <Button
            variant="outline"
            onClick={secondaryAction.onClick}
            className="w-full sm:w-auto min-h-[48px] text-base"
          >
            {secondaryAction.label}
          </Button>
        )}
        {primaryAction && (
          <Button
            onClick={primaryAction.onClick}
            className="w-full sm:w-auto min-h-[48px] text-base"
          >
            {primaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
};

export default OnboardingStep;
