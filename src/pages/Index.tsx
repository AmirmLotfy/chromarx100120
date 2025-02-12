
import { useState, useEffect } from "react";
import { useSubscription } from "@/hooks/use-subscription";
import Layout from "@/components/Layout";
import FeatureGrid from "@/components/FeatureGrid";
import AffiliateBannerCarousel from "@/components/services/AffiliateBannerCarousel";
import OnboardingContainer from "@/components/onboarding/OnboardingContainer";
import OnboardingWelcome from "@/components/onboarding/OnboardingWelcome";
import OnboardingAuth from "@/components/onboarding/OnboardingAuth";
import OnboardingFeature from "@/components/onboarding/OnboardingFeature";
import { chromeDb } from "@/lib/chrome-storage";
import { toast } from "sonner";

const Index = () => {
  const { currentPlan } = useSubscription();
  const [showOnboarding, setShowOnboarding] = useState(true); // Changed to true for testing
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3; // Updated to match our current steps

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      const completed = await chromeDb.get('onboarding_completed');
      if (!completed) {
        setShowOnboarding(true);
      }
    };
    checkOnboardingStatus();
  }, []);

  const handleCloseOnboarding = async () => {
    await chromeDb.set('onboarding_completed', true);
    setShowOnboarding(false);
    toast.success("Welcome to ChroMarx!");
  };

  const handleNextStep = () => {
    if (currentStep === totalSteps) {
      handleCloseOnboarding();
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const renderOnboardingStep = () => {
    switch (currentStep) {
      case 1:
        return <OnboardingWelcome onNext={handleNextStep} />;
      case 2:
        return <OnboardingAuth onNext={handleNextStep} onSkip={handleNextStep} />;
      case 3:
        return <OnboardingFeature onNext={handleNextStep} onBack={handlePreviousStep} />;
      default:
        return null;
    }
  };

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
          onClose={handleCloseOnboarding}
        >
          {renderOnboardingStep()}
        </OnboardingContainer>
      )}
    </Layout>
  );
};

export default Index;
