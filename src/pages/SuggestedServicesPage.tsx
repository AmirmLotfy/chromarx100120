import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import AffiliateBannerCarousel from "@/components/services/AffiliateBannerCarousel";
import { toast } from "sonner";
import { useSettings } from "@/stores/settingsStore";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

const SuggestedServicesPage = () => {
  const { affiliateBannersEnabled } = useSettings();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Suggested Services
          </h1>
          <p className="text-muted-foreground max-w-[700px]">
            Discover carefully curated services to enhance your browsing experience and boost productivity
          </p>
        </div>

        {affiliateBannersEnabled && (
          <Card className="overflow-hidden bg-gradient-to-b from-accent to-background border-none shadow-lg">
            <CardContent className="p-0">
              <AffiliateBannerCarousel />
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 space-y-4">
                <div className="h-40 rounded-lg bg-gradient-to-br from-primary/5 to-secondary/10 flex items-center justify-center">
                  <span className="text-primary/40">Service Preview {index}</span>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                    Premium Service {index}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Enhance your productivity with our carefully selected premium services
                  </p>
                  <div className="flex items-center text-sm text-primary font-medium pt-2 group-hover:translate-x-1 transition-transform">
                    Learn more
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default SuggestedServicesPage;