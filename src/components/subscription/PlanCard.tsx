
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Plan } from "@/config/subscriptionPlans";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface PlanCardProps extends Plan {
  onSelect?: (planId: string) => void;
  isSelected?: boolean;
  isCurrentPlan?: boolean;
  billingCycle?: "monthly" | "yearly";
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
  isCurrentPlan,
  billingCycle = "monthly"
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

  const price = billingCycle === "yearly" ? pricing.yearly : pricing.monthly;
  const period = billingCycle === "yearly" ? "year" : "month";

  return (
    <div className={`relative rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden transition-all ${isSelected || isCurrentPlan ? "border-primary ring-1 ring-primary" : ""} ${isSelected ? "scale-[1.02]" : ""}`}>
      {isPopular && (
        <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-medium py-1 px-3 rounded-bl">
          Popular
        </div>
      )}

      <div className="p-6">
        <h3 className="text-2xl font-bold">{name}</h3>
        <p className="text-muted-foreground mt-1.5 mb-4 min-h-[40px]">{description}</p>

        <div className="mb-6">
          <span className="text-3xl font-bold">
            ${price.toFixed(2)}
          </span>
          <span className="text-muted-foreground ml-1">/{period}</span>
          
          {billingCycle === "yearly" && pricing.yearly < pricing.monthly * 12 && (
            <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
              Save ${(pricing.monthly * 12 - pricing.yearly).toFixed(2)}
            </Badge>
          )}
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
          variant={pricing.monthly === 0 ? "outline" : isSelected ? "default" : "outline"}
          disabled={isLoading || isCurrentPlan}
          onClick={handleSelect}
        >
          {isCurrentPlan
            ? "Current Plan"
            : pricing.monthly === 0
            ? "Get Started"
            : isSelected
            ? "Selected"
            : "Select Plan"}
        </Button>
      </div>
    </div>
  );
};

export default PlanCard;
