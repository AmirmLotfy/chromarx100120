
import { useOnboarding } from "./OnboardingProvider";
import { useChromeAuth } from "@/contexts/ChromeAuthContext";
import { toast } from "sonner";
import OnboardingContainer from "./OnboardingContainer";
import OnboardingContent from "./OnboardingContent";
import createOnboardingSteps from "./config/onboardingSteps";

const OnboardingOverlay = () => {
  const { currentStep, isOnboardingComplete, setCurrentStep, completeOnboarding } = useOnboarding();
  const { user } = useChromeAuth();
  const totalSteps = 4;

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

  const steps = createOnboardingSteps(setCurrentStep, handleImportBookmarks, handleComplete);
  const currentStepData = steps[currentStep - 1];

  return (
    <OnboardingContainer>
      <OnboardingContent
        currentStep={currentStep}
        totalSteps={totalSteps}
        stepData={currentStepData}
      />
    </OnboardingContainer>
  );
};

export default OnboardingOverlay;
