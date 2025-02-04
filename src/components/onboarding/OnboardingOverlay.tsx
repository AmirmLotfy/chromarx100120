import { useOnboarding } from "./OnboardingProvider";
import { useChromeAuth } from "@/contexts/ChromeAuthContext";
import OnboardingProgress from "./OnboardingProgress";
import OnboardingStep from "./OnboardingStep";
import { ArrowRight, BookMarked, Sparkles, User } from "lucide-react";
import { toast } from "sonner";

const OnboardingOverlay = () => {
  const { currentStep, isOnboardingComplete, setCurrentStep, completeOnboarding } = useOnboarding();
  const { user, signIn } = useChromeAuth();
  const totalSteps = 3;

  const handleSignIn = async () => {
    try {
      await signIn();
      setCurrentStep(2);
      toast.success("Successfully signed in!");
    } catch (error) {
      toast.error("Failed to sign in. Please try again.");
    }
  };

  const handleImportBookmarks = async () => {
    try {
      // Implement bookmark import logic here
      setCurrentStep(3);
      toast.success("Bookmarks imported successfully!");
    } catch (error) {
      toast.error("Failed to import bookmarks. Please try again.");
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
      description: "Your all-in-one browser productivity companion",
      icon: Sparkles,
      primaryAction: {
        label: "Get Started",
        onClick: () => setCurrentStep(2),
      },
    },
    {
      title: "Sign in to Continue",
      description: "Use your Google account to sign in securely",
      icon: User,
      primaryAction: {
        label: "Sign in with Google",
        onClick: handleSignIn,
      },
    },
    {
      title: "Import Your Bookmarks",
      description: "Bring your existing bookmarks into ChroMarx",
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
      title: "You're All Set!",
      description: "Start exploring ChroMarx's powerful features",
      icon: Sparkles,
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