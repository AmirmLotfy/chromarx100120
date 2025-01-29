import Layout from "@/components/Layout";
import AffiliateSection from "@/components/affiliate/AffiliateSection";

const SuggestedServicesPage = () => {
  return (
    <Layout>
      <div className="container max-w-7xl mx-auto py-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Suggested Services</h1>
          <p className="text-muted-foreground">
            Discover tools and services that can enhance your productivity
          </p>
        </div>
        <AffiliateSection showAll={true} />
      </div>
    </Layout>
  );
};

export default SuggestedServicesPage;