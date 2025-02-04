import Layout from "@/components/Layout";
import FeatureGrid from "@/components/FeatureGrid";
import { useChromeAuth } from "@/contexts/ChromeAuthContext";
import { useEffect, useState } from "react";
import { storage } from "@/lib/chrome-utils";
import AffiliateBannerCarousel from "@/components/services/AffiliateBannerCarousel";
import WelcomeCard from "@/components/WelcomeCard";
import OnboardingOverlay from "@/components/onboarding/OnboardingOverlay";
import { useOnboarding } from "@/components/onboarding/OnboardingProvider";

const Index = () => {
  const { user } = useChromeAuth();
  const { isOnboardingComplete } = useOnboarding();
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("free");

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (user) {
        try {
          console.log("Fetching subscription status for user:", user.id);
          const subscriptionData = await storage.get('subscriptions');
          const status = subscriptionData?.[user.id]?.status || "free";
          console.log("User subscription status:", status);
          setSubscriptionStatus(status);
        } catch (error) {
          console.error("Error fetching subscription status:", error);
          setSubscriptionStatus("free");
        }
      } else {
        console.log("No user logged in, defaulting to free tier");
        setSubscriptionStatus("free");
      }
    };

    fetchSubscriptionStatus();
  }, [user]);

  // Force onboarding for non-logged in users
  if (!user || !isOnboardingComplete) {
    return (
      <Layout>
        <WelcomeCard />
        <OnboardingOverlay />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full">
        {subscriptionStatus === "free" && (
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