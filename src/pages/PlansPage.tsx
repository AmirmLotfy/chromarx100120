import Layout from "@/components/Layout";
import PlanCard from "@/components/subscription/PlanCard";
import { plans } from "@/config/plans";

const PlansPage = () => {
  return (
    <Layout>
      <div className="container max-w-[1400px] mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight mb-4">
            Choose Your Plan
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Select the plan that best fits your needs. All plans include our core
            features with additional capabilities as you upgrade.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <PlanCard key={plan.id} {...plan} />
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default PlansPage;