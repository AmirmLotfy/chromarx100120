
import Layout from "@/components/Layout";
import FeatureGrid from "@/components/FeatureGrid";
import { useChromeAuth } from "@/contexts/ChromeAuthContext";
import AffiliateBannerCarousel from "@/components/services/AffiliateBannerCarousel";
import OnboardingOverlay from "@/components/onboarding/OnboardingOverlay";
import { useOnboarding } from "@/components/onboarding/OnboardingProvider";
import { useSubscription } from "@/hooks/use-subscription";

const Index = () => {
  const { user } = useChromeAuth();
  const { isOnboardingComplete } = useOnboarding();
  const { currentPlan } = useSubscription();

  // Show onboarding for non-logged in users or if onboarding is not complete
  if (!isOnboardingComplete) {
    return (
      <Layout>
        <OnboardingOverlay />
      </Layout>
    );
  }

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
    </Layout>
  );
};

export default Index;
