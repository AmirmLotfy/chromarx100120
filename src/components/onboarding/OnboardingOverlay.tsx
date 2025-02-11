
import { useOnboarding } from "./OnboardingProvider";
import { useChromeAuth } from "@/contexts/ChromeAuthContext";
import OnboardingProgress from "./OnboardingProgress";
import OnboardingStep from "./OnboardingStep";
import { BookMarked, Bookmark, Settings, Zap } from "lucide-react";
import { toast } from "sonner";

const OnboardingOverlay = () => {
  const { currentStep, isOnboardingComplete, setCurrentStep, completeOnboarding } = useOnboarding();
  const { user } = useChromeAuth();
  const totalSteps = 4; // Reduced from 5 to 4 steps

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
        onClick: () => setCurrentStep(4),
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

