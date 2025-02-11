
import { useOnboarding } from "./OnboardingProvider";
import { useChromeAuth } from "@/contexts/ChromeAuthContext";
import { useSubscription } from "@/hooks/use-subscription";
import OnboardingProgress from "./OnboardingProgress";
import OnboardingStep from "./OnboardingStep";
import { BookMarked, Bookmark, Sparkles, Settings, Zap, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { subscriptionPlans } from "@/config/subscriptionPlans";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "../ui/button";

const OnboardingOverlay = () => {
  const { currentStep, isOnboardingComplete, setCurrentStep, completeOnboarding } = useOnboarding();
  const { user } = useChromeAuth();
  const { setSubscriptionPlan } = useSubscription();
  const isMobile = useIsMobile();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const totalSteps = 5;

  const handleImportBookmarks = async () => {
    try {
      console.log("Starting bookmark import...");
      const bookmarks = await chrome.bookmarks.getTree();
      console.log("Bookmarks retrieved:", bookmarks);
      setCurrentStep(3);
      toast.success("Bookmarks imported successfully!");
    } catch (error) {
      console.error("Bookmark import error:", error);
      toast.error("Failed to import bookmarks. Please try again.");
    }
  };

  const handlePlanSelection = (planId: string) => {
    console.log("Plan selected:", planId);
    setSelectedPlanId(planId);
  };

  const handleContinueWithPlan = async () => {
    if (!selectedPlanId) {
      toast.error("Please select a plan to continue");
      return;
    }

    try {
      console.log("Setting subscription plan:", selectedPlanId);
      await setSubscriptionPlan(selectedPlanId);
      toast.success(`${selectedPlanId.charAt(0).toUpperCase() + selectedPlanId.slice(1)} plan selected!`);
      setCurrentStep(4);
    } catch (error) {
      console.error("Plan selection error:", error);
      toast.error("Failed to select plan. Please try again.");
    }
  };

  const handleComplete = () => {
    completeOnboarding();
    toast.success("Welcome to ChroMarx!");
  };

  // Show overlay for non-logged in users or if onboarding is not complete
  if (user && isOnboardingComplete) return null;

  const steps = [
    {
      title: "Welcome to ChroMarx",
      description: "Your all-in-one browser productivity companion. Let's get you started!",
      icon: "/lovable-uploads/cab9ee44-1599-487e-86b9-4c7b064cf78e.png",
      primaryAction: {
        label: "Get Started",
        onClick: () => setCurrentStep(2),
      },
    },
    {
      title: "Import Your Bookmarks",
      description: "Bring your existing bookmarks into ChroMarx for better organization",
      icon: BookMarked,
      primaryAction: {
        label: "Import Bookmarks",
        onClick: handleImportBookmarks,
      },
      secondaryAction: {
        label: "Skip for now",
        onClick: () => setCurrentStep(3),
      },
    },
    {
      title: "Choose Your Plan",
      description: "Select a plan that best fits your needs",
      icon: Sparkles,
      content: (
        <div className="space-y-4">
          {isMobile && (
            <div className="flex items-center justify-center text-muted-foreground mb-2">
              <ArrowDown className="w-4 h-4 mr-1" />
              <span className="text-sm">Scroll to see more</span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto">
            {subscriptionPlans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => handlePlanSelection(plan.id)}
                className={`p-4 rounded-lg border cursor-pointer transition-all hover:border-primary hover:shadow-md active:scale-95 text-left relative ${
                  selectedPlanId === plan.id ? 'border-primary bg-primary/5' : 'border-border'
                } ${plan.isPopular ? 'ring-2 ring-primary ring-offset-2' : ''}`}
              >
                <h3 className="font-semibold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
                <p className="mt-2 font-medium">${plan.pricing.monthly}/month</p>
                {plan.isPopular && (
                  <span className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 bg-primary text-white text-xs px-2 py-1 rounded-full">
                    Popular
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="flex justify-center mt-6">
            <Button
              onClick={handleContinueWithPlan}
              disabled={!selectedPlanId}
              className="w-full sm:w-auto"
            >
              Continue with {selectedPlanId ? subscriptionPlans.find(p => p.id === selectedPlanId)?.name : 'selected plan'}
            </Button>
          </div>
        </div>
      ),
    },
    {
      title: "Explore Key Features",
      description: "Discover what makes ChroMarx special",
      icon: Zap,
      content: (
        <div className="space-y-4 my-4">
          <div className="flex items-start space-x-3">
            <Bookmark className="w-5 h-5 text-primary mt-1" />
            <div>
              <h3 className="font-medium">Smart Bookmarking</h3>
              <p className="text-sm text-muted-foreground">Organize bookmarks with AI-powered categorization</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Settings className="w-5 h-5 text-primary mt-1" />
            <div>
              <h3 className="font-medium">Customizable Workspace</h3>
              <p className="text-sm text-muted-foreground">Personalize your experience with themes and layouts</p>
            </div>
          </div>
        </div>
      ),
      primaryAction: {
        label: "Next",
        onClick: () => setCurrentStep(5),
      },
    },
    {
      title: "You're All Set!",
      description: "Start exploring ChroMarx's powerful features",
      icon: "/lovable-uploads/cab9ee44-1599-487e-86b9-4c7b064cf78e.png",
      primaryAction: {
        label: "Get Started",
        onClick: handleComplete,
      },
    },
  ];

  const currentStepData = steps[currentStep - 1];

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-start md:items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card w-full max-w-md rounded-lg border shadow-lg p-6 space-y-6 my-8">
        <OnboardingProgress currentStep={currentStep} totalSteps={totalSteps} />
        <OnboardingStep {...currentStepData} />
      </div>
    </div>
  );
};

export default OnboardingOverlay;

