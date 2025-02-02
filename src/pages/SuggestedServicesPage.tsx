import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import AffiliateBannerCarousel from "@/components/services/AffiliateBannerCarousel";
import { toast } from "sonner";
import { useSettings } from "@/stores/settingsStore";
import { Card, CardContent } from "@/components/ui/card";

const SuggestedServicesPage = () => {
  const { affiliateBannersEnabled } = useSettings();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading state for banner system
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    console.log("Affiliate banners enabled:", affiliateBannersEnabled);
  }, [affiliateBannersEnabled]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Suggested Services</h1>
          <p className="text-muted-foreground">
            Discover carefully curated services to enhance your browsing experience
          </p>
        </div>

        {affiliateBannersEnabled && (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <AffiliateBannerCarousel />
            </CardContent>
          </Card>
        )}

        {/* Additional services content will go here */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Service cards will be added here in future updates */}
        </div>
      </div>
    </Layout>
  );
};

export default SuggestedServicesPage;