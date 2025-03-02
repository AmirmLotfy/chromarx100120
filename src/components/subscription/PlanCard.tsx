
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Plan } from "@/config/subscriptionPlans";
import { useState } from "react";
import { toast } from "sonner";

interface PlanCardProps extends Plan {
  onSelect?: (planId: string) => void;
  isSelected?: boolean;
  isCurrentPlan?: boolean;
}

const PlanCard = ({
  id,
  name,
  pricing,
  description,
  features,
  isPopular,
  onSelect,
  isSelected,
  isCurrentPlan
}: PlanCardProps) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSelect = async () => {
    if (isCurrentPlan) {
      toast.info("You are already subscribed to this plan");
      return;
    }
    
    if (onSelect) {
      setIsLoading(true);
      try {
        onSelect(id);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className={`relative rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden ${isSelected || isCurrentPlan ? "border-primary" : ""}`}>
      {isPopular && (
        <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-medium py-1 px-3 rounded-bl">
          Popular
        </div>
      )}

      <div className="p-6">
        <h3 className="text-2xl font-bold">{name}</h3>
        <p className="text-muted-foreground mt-1.5 mb-4">{description}</p>

        <div className="mb-6">
          <span className="text-3xl font-bold">
            ${pricing.monthly.toFixed(2)}
          </span>
          <span className="text-muted-foreground ml-1">/month</span>
        </div>

        <ul className="space-y-2 mb-6">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              {feature.included ? (
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              ) : (
                <span className="h-5 w-5 shrink-0" />
              )}
              <span className={feature.included ? "" : "text-muted-foreground"}>
                {feature.name}
              </span>
            </li>
          ))}
        </ul>

        <Button
          className="w-full"
          variant={pricing.monthly === 0 ? "outline" : "default"}
          disabled={isLoading || isCurrentPlan}
          onClick={handleSelect}
        >
          {isCurrentPlan
            ? "Current Plan"
            : pricing.monthly === 0
            ? "Get Started"
            : "Subscribe"}
        </Button>
      </div>
    </div>
  );
};

export default PlanCard;
