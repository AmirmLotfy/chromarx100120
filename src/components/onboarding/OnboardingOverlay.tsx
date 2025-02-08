
import { useOnboarding } from "./OnboardingProvider";
import { useChromeAuth } from "@/contexts/ChromeAuthContext";
import { useSubscription } from "@/hooks/use-subscription";
import OnboardingProgress from "./OnboardingProgress";
import OnboardingStep from "./OnboardingStep";
import { BookMarked, Bookmark, User, Sparkles, Settings, Zap } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";
import { subscriptionPlans } from "@/config/subscriptionPlans";

const OnboardingOverlay = () => {
  const { currentStep, isOnboardingComplete, setCurrentStep, completeOnboarding } = useOnboarding();
  const { user, signIn } = useChromeAuth();
  const { setSubscriptionPlan } = useSubscription();
  const totalSteps = 6;

  useEffect(() => {
    // Auto-advance to next step if user is already signed in
    if (user && currentStep === 2) {
      console.log('User already signed in, advancing to next step');
      setCurrentStep(3);
    }
  }, [user, currentStep, setCurrentStep]);

  const handleSignIn = async () => {
    try {
      console.log("Starting sign in process...");
      await signIn();
      console.log("Sign in completed successfully");
      // useEffect will handle advancing to next step
    } catch (error) {
      console.error("Sign in error:", error);
      toast.error("Failed to sign in. Please try again.");
    }
  };

  const handleImportBookmarks = async () => {
    try {
      console.log("Starting bookmark import...");
      const bookmarks = await chrome.bookmarks.getTree();
      console.log("Bookmarks retrieved:", bookmarks);
      setCurrentStep(4);
      toast.success("Bookmarks imported successfully!");
    } catch (error) {
      console.error("Bookmark import error:", error);
      toast.error("Failed to import bookmarks. Please try again.");
    }
  };

  const handleSelectPlan = async (planId: string) => {
    try {
      console.log("Setting subscription plan:", planId);
      await setSubscriptionPlan(planId);
      setCurrentStep(5);
      toast.success(`${planId.charAt(0).toUpperCase() + planId.slice(1)} plan selected!`);
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
      title: "Sign in to Continue",
      description: "Use your Google account to sign in securely and sync your data across devices",
      icon: User,
      primaryAction: {
        label: "Sign in with Google",
        onClick: handleSignIn,
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
        onClick: () => setCurrentStep(4),
      },
    },
    {
      title: "Choose Your Plan",
      description: "Select a plan that best fits your needs",
      icon: Sparkles,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
          {subscriptionPlans.map((plan) => (
            <div
              key={plan.id}
              className={`p-4 rounded-lg border cursor-pointer hover:border-primary transition-colors ${
                plan.isPopular ? 'border-primary' : 'border-border'
              }`}
              onClick={() => handleSelectPlan(plan.id)}
            >
              <h3 className="font-semibold">{plan.name}</h3>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
              <p className="mt-2 font-medium">${plan.pricing.monthly}/month</p>
            </div>
          ))}
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
        onClick: () => setCurrentStep(6),
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
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-md rounded-lg border shadow-lg p-6 space-y-6">
        <OnboardingProgress currentStep={currentStep} totalSteps={totalSteps} />
        <OnboardingStep {...currentStepData} />
      </div>
    </div>
  );
};

export default OnboardingOverlay;
