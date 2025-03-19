import { useSubscription } from "@/hooks/use-subscription";
import { useElementSelector } from "@/hooks/useElementSelector";
import Layout from "@/components/Layout";
import FeatureGrid from "@/components/FeatureGrid";
import AffiliateBannerCarousel from "@/components/services/AffiliateBannerCarousel";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import StreamProcessingDemo from "@/components/data-processing/StreamProcessingDemo";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const Index = () => {
  const { currentPlan } = useSubscription();
  const { user } = useAuth();
  const [showDemo, setShowDemo] = useState(false);

  const handleElementSelected = (element: HTMLElement) => {
    console.log('Selected element:', element);
    toast.success("Element selected successfully!");
  };

  const { startSelecting } = useElementSelector(handleElementSelected);

  return (
    <Layout>
      {currentPlan === "free" && (
        <div className="w-full">
          <AffiliateBannerCarousel />
        </div>
      )}
      
      <div className="mb-8 flex justify-center">
        <Button 
          onClick={() => setShowDemo(!showDemo)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          {showDemo ? "Hide Stream Processing Demo" : "Show Stream Processing Demo"}
        </Button>
      </div>
      
      {showDemo && <StreamProcessingDemo />}
      
      <FeatureGrid />
      
      <div className="p-4">
        <a href="/timer" className="px-4 py-2 bg-primary text-white rounded-md">Go to Timer</a>
      </div>
    </Layout>
  );
};

export default Index;
