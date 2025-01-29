import Layout from "@/components/Layout";
import AffiliateSection from "@/components/affiliate/AffiliateSection";

const SuggestedServicesPage = () => {
  return (
    <Layout>
      <div className="flex-1 w-full max-h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="container max-w-7xl mx-auto p-4 sm:py-6 space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Suggested Services</h1>
            <p className="text-muted-foreground">
              Discover tools and services that can enhance your productivity
            </p>
          </div>
          <AffiliateSection showAll={true} />
        </div>
      </div>
    </Layout>
  );
};

export default SuggestedServicesPage;