
import { useState, useEffect } from "react";
import { useSubscription } from "@/hooks/use-subscription";
import Layout from "@/components/Layout";
import FeatureGrid from "@/components/FeatureGrid";
import AffiliateBannerCarousel from "@/components/services/AffiliateBannerCarousel";
import OnboardingContainer from "@/components/onboarding/OnboardingContainer";
import OnboardingContent from "@/components/onboarding/OnboardingContent";
import createOnboardingSteps from "@/components/onboarding/config/onboardingSteps";
import { auth } from "@/lib/chrome-utils";
import { toast } from "sonner";

const Index = () => {
  const { currentPlan, setSubscriptionPlan } = useSubscription();
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const handleComplete = async () => {
    try {
      await chrome.storage.sync.set({ onboarding_completed: true });
      setShowOnboarding(false);
      toast.success("Welcome to ChroMarx!");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast.error("Failed to complete setup");
    }
  };

  const handleSignIn = async () => {
    try {
      const user = await auth.signIn();
      if (user) {
        toast.success("Successfully signed in!");
        setCurrentStep(3);
      }
    } catch (error) {
      console.error("Sign in error:", error);
      toast.error("Failed to sign in with Google");
    }
  };

  const handleImportBookmarks = async () => {
    try {
      const bookmarks = await chrome.bookmarks.getTree();
      await chrome.storage.sync.set({ imported_bookmarks: bookmarks });
      toast.success("Bookmarks imported successfully!");
      setCurrentStep(4);
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import bookmarks");
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      await setSubscriptionPlan(planId);
      toast.success("Subscription updated successfully!");
      handleComplete();
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error("Failed to update subscription");
    }
  };

  useEffect(() => {
    const checkOnboarding = async () => {
      const completed = await chrome.storage.sync.get('onboarding_completed');
      if (completed.onboarding_completed) {
        setShowOnboarding(false);
      }
    };
    checkOnboarding();
  }, []);

  const onboardingSteps = createOnboardingSteps(
    setCurrentStep,
    handleImportBookmarks,
    handleComplete,
    handleSignIn,
    handleSubscribe
  );

  return (
    <Layout>
      <div className="w-full">
        {currentPlan === "free" && (
          <div className="w-full">
            <AffiliateBannerCarousel />
          </div>
        )}
        <FeatureGrid />
      </div>

      {showOnboarding && (
        <OnboardingContainer
          currentStep={currentStep}
          totalSteps={totalSteps}
        >
          <OnboardingContent
            currentStep={currentStep}
            totalSteps={totalSteps}
            stepData={onboardingSteps[currentStep - 1]}
          />
        </OnboardingContainer>
      )}
    </Layout>
  );
};

export default Index;
