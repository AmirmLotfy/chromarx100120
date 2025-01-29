import Layout from "@/components/Layout";
import AffiliateSection from "@/components/affiliate/AffiliateSection";

const SuggestedServicesPage = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Suggested Services</h1>
          <p className="text-muted-foreground">
            Discover tools and services that can enhance your productivity
          </p>
        </div>
        <AffiliateSection />
      </div>
    </Layout>
  );
};

export default SuggestedServicesPage;