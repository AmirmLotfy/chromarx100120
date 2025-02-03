import { LucideIcon } from "lucide-react";

interface OnboardingStepProps {
  title: string;
  description: string;
  content: string;
  icon: LucideIcon;
  children?: React.ReactNode;
}

const OnboardingStep = ({ title, description, content, icon: Icon, children }: OnboardingStepProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-full bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>
      <p className="text-muted-foreground text-sm">{content}</p>
      {children}
    </div>
  );
};

export default OnboardingStep;