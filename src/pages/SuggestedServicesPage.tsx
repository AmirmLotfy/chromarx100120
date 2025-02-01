import Layout from "@/components/Layout";
import AffiliateSection from "@/components/affiliate/AffiliateSection";
import { ScrollArea } from "@/components/ui/scroll-area";

const SuggestedServicesPage = () => {
  return (
    <Layout>
      <div className="space-y-6 px-4 md:px-6 pb-20 md:pb-6 pt-6 md:pt-8">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Suggested Services
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Discover tools and services that can enhance your productivity
          </p>
        </div>
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <AffiliateSection showAll={true} />
        </ScrollArea>
      </div>
    </Layout>
  );
};

export default SuggestedServicesPage;