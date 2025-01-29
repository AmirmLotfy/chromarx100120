import Layout from "@/components/Layout";
import AffiliateSection from "@/components/affiliate/AffiliateSection";
import { ScrollArea } from "@/components/ui/scroll-area";

const SuggestedServicesPage = () => {
  return (
    <Layout>
      <ScrollArea className="h-[calc(100vh-4rem)] w-full">
        <div className="container max-w-7xl mx-auto px-4 py-6 space-y-8">
          {/* Header Section */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Suggested Services
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Discover tools and services that can enhance your productivity
            </p>
          </div>

          {/* Main Content */}
          <div className="grid gap-8">
            {/* Featured Service */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight">
                  Featured Service
                </h2>
                <span className="text-xs bg-accent px-3 py-1 rounded-full text-muted-foreground">
                  Recommended
                </span>
              </div>
              <div className="bg-gradient-to-br from-accent/50 to-background rounded-xl p-4">
                <AffiliateSection showAll={false} />
              </div>
            </section>

            {/* All Services */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight">
                  All Recommended Services
                </h2>
                <span className="text-xs bg-primary/10 px-3 py-1 rounded-full text-primary">
                  5 services
                </span>
              </div>
              <div className="bg-gradient-to-br from-[#F1F0FB] to-white dark:from-gray-800 dark:to-gray-900 rounded-xl p-4">
                <AffiliateSection showAll={true} />
              </div>
            </section>
          </div>

          {/* Footer Note */}
          <p className="text-xs text-center text-muted-foreground pt-4">
            We may earn a commission when you purchase through these links.
          </p>
        </div>
      </ScrollArea>
    </Layout>
  );
};

export default SuggestedServicesPage;