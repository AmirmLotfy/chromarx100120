import { useOnboarding } from "./OnboardingProvider";
import { useChromeAuth } from "@/contexts/ChromeAuthContext";
import { useSubscription } from "@/hooks/use-subscription";
import OnboardingProgress from "./OnboardingProgress";
import OnboardingStep from "./OnboardingStep";
import { BookMarked, Bookmark, Sparkles, Settings, Zap, ArrowDown, Check, Info } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { subscriptionPlans } from "@/config/subscriptionPlans";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "../ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

const OnboardingOverlay = () => {
  const { currentStep, isOnboardingComplete, setCurrentStep, completeOnboarding } = useOnboarding();
  const { user } = useChromeAuth();
  const { setSubscriptionPlan } = useSubscription();
  const isMobile = useIsMobile();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const totalSteps = 5;

  // Set basic plan as default when component mounts
  useEffect(() => {
    const basicPlan = subscriptionPlans.find(plan => plan.id === 'basic');
    if (basicPlan) {
      setSelectedPlanId('basic');
    }
  }, []);

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
              <ArrowDown className="w-4 h-4 mr-1 animate-bounce" />
              <span className="text-sm">Swipe to explore plans</span>
            </div>
          )}
          <div className="flex flex-nowrap gap-4 overflow-x-auto pb-4 px-2 -mx-2 snap-x scrollbar-hide">
            {subscriptionPlans.map((plan) => (
              <div
                key={plan.id}
                className={`flex-none w-[85vw] sm:w-[300px] snap-center flex flex-col rounded-lg border transition-all cursor-pointer
                  ${selectedPlanId === plan.id ? 'border-primary ring-2 ring-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                  ${plan.isPopular ? 'scale-[1.02] shadow-lg' : ''}`}
                onClick={() => handlePlanSelection(plan.id)}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="flex-1 p-4 sm:p-6 space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>

                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold">${plan.pricing.monthly}</span>
                    <span className="text-muted-foreground ml-1">/month</span>
                  </div>

                  <div className="space-y-2.5">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        {feature.included ? (
                          <Check className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                        ) : (
                          <div className="w-4 h-4 border-2 rounded-full mt-1 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-sm">
                            {feature.name}
                            {feature.description && (
                              <HoverCard>
                                <HoverCardTrigger>
                                  <Info className="w-3 h-3 inline-block ml-1 text-muted-foreground" />
                                </HoverCardTrigger>
                                <HoverCardContent side="top" className="text-xs w-64">
                                  {feature.description}
                                </HoverCardContent>
                              </HoverCard>
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 sm:p-6 pt-0">
                  <Button
                    variant={selectedPlanId === plan.id ? "default" : "outline"}
                    className="w-full"
                    onClick={() => handlePlanSelection(plan.id)}
                  >
                    {selectedPlanId === plan.id ? "Selected" : "Select Plan"}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-4">
            <Button
              size="lg"
              onClick={handleContinueWithPlan}
              disabled={!selectedPlanId}
              className="w-full sm:w-auto px-8"
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
      <div className="bg-card w-full max-w-4xl rounded-lg border shadow-lg p-4 sm:p-6 space-y-6 my-4 sm:my-8">
        <OnboardingProgress currentStep={currentStep} totalSteps={totalSteps} />
        <OnboardingStep {...currentStepData} />
      </div>
    </div>
  );
};

export default OnboardingOverlay;
