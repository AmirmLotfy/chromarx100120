
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
import { toast } from "sonner";

const Index = () => {
  const { currentPlan, setSubscriptionPlan } = useSubscription();
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
        toast.success("Bookmarks imported successfully");
      }
    } catch (error) {
      console.error('Error importing bookmarks:', error);
      toast.error("Failed to import bookmarks");
    }
    setCurrentStep(4);
  };

  const handleSignIn = async () => {
    try {
      const token = await chrome.identity.getAuthToken({ 
        interactive: true,
        scopes: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile']
      });

      if (chrome.runtime.lastError) {
        throw new Error(chrome.runtime.lastError.message);
      }

      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }

      const data = await response.json();
      await chromeDb.set('user', {
        id: data.sub,
        email: data.email,
        displayName: data.name,
        photoURL: data.picture
      });

      toast.success("Successfully signed in");
      setCurrentStep(3);
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error("Failed to sign in");
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      await setSubscriptionPlan(planId);
      toast.success(`Successfully subscribed to ${planId} plan`);
      handleComplete();
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error("Failed to update subscription");
    }
  };

  const handleComplete = async () => {
    await chromeDb.set('onboarding_completed', true);
    setShowOnboarding(false);
    toast.success("Welcome to ChroMarx!");
  };

  const onboardingSteps = createOnboardingSteps(
    setCurrentStep,
    handleImportBookmarks,
    handleComplete,
    handleSignIn,
    handleSubscribe
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
