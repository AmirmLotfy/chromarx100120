import Layout from "../components/Layout";
import FeatureGrid from "../components/FeatureGrid";
import WelcomeCard from "../components/WelcomeCard";
import CompactServiceBanner from "../components/affiliate/CompactServiceBanner";
import { useFirebase } from "@/contexts/FirebaseContext";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const Index = () => {
  const { user } = useFirebase();
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("free");

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (user) {
        try {
          console.log("Fetching subscription status for user:", user.uid);
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const status = userDoc.data().subscriptionStatus || "free";
            console.log("User subscription status:", status);
            setSubscriptionStatus(status);
          }
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
      <div className="space-y-4 pb-16">
        <WelcomeCard />
        {subscriptionStatus === "free" && <CompactServiceBanner />}
        <FeatureGrid />
      </div>
    </Layout>
  );
};

export default Index;