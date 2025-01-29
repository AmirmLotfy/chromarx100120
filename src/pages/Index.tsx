import Layout from "../components/Layout";
import FeatureGrid from "../components/FeatureGrid";

const Index = () => {
  return (
    <Layout>
      <div className="space-y-6 pb-16">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground">
            Access your favorite features below
          </p>
        </div>
        <FeatureGrid />
      </div>
    </Layout>
  );
};

export default Index;