
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

  return (
    <Layout>
      {!isOnboardingComplete ? (
        <OnboardingOverlay />
      ) : (
        <div className="w-full">
          {currentPlan === "free" && (
            <div className="w-full">
              <AffiliateBannerCarousel />
            </div>
          )}
          <FeatureGrid />
        </div>
      )}
    </Layout>
  );
};

export default Index;
