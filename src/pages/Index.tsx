import Layout from "../components/Layout";
import FeatureGrid from "../components/FeatureGrid";
import { useFirebase } from "@/contexts/FirebaseContext";
import { useEffect, useState } from "react";
import { storage } from "@/lib/chrome-utils";
import AffiliateBannerCarousel from "@/components/services/AffiliateBannerCarousel";

const Index = () => {
  const { user } = useFirebase();
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

  return (
    <Layout>
      <div className="space-y-6 pb-16 w-full max-w-6xl mx-auto">
        {subscriptionStatus === "free" && (
          <div className="px-3 sm:px-4 -mt-4">
            <AffiliateBannerCarousel />
          </div>
        )}
        <FeatureGrid />
      </div>
    </Layout>
  );
};

export default Index;