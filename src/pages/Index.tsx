
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import FeatureGrid from "@/components/FeatureGrid";
import { useSubscription } from "@/hooks/use-subscription";
import AffiliateBannerCarousel from "@/components/services/AffiliateBannerCarousel";
import OnboardingContainer from "@/components/onboarding/OnboardingContainer";
import OnboardingContent from "@/components/onboarding/OnboardingContent";
import createOnboardingSteps from "@/components/onboarding/config/onboardingSteps";
import { chromeDb } from "@/lib/chrome-storage";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const { currentPlan } = useSubscription();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const isMobile = useIsMobile();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      const completed = await chromeDb.get('onboarding_completed');
      if (!completed) {
        setShowOnboarding(true);
      }
    };
    checkOnboardingStatus();
  }, []);

  const handleImportBookmarks = async () => {
    try {
      if (chrome.bookmarks) {
        const bookmarks = await chrome.bookmarks.getTree();
        console.log('Bookmarks imported:', bookmarks);
      }
    } catch (error) {
      console.error('Error importing bookmarks:', error);
    }
    setCurrentStep(3);
  };

  const handleComplete = async () => {
    await chromeDb.set('onboarding_completed', true);
    setShowOnboarding(false);
  };

  const onboardingSteps = createOnboardingSteps(
    setCurrentStep,
    handleImportBookmarks,
    handleComplete
  );

  const stepData = onboardingSteps[currentStep - 1];
  const totalSteps = onboardingSteps.length;

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
        <OnboardingContainer>
          <OnboardingContent
            currentStep={currentStep}
            totalSteps={totalSteps}
            stepData={stepData}
          />
        </OnboardingContainer>
      )}
    </Layout>
  );
};

export default Index;
