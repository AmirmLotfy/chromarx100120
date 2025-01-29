import Layout from "@/components/Layout";
import SubscriptionSettings from "@/components/settings/SubscriptionSettings";
import FeedbackForm from "@/components/settings/FeedbackForm";
import AffiliateSettings from "@/components/settings/AffiliateSettings";
import GeminiApiKeyForm from "@/components/settings/GeminiApiKeyForm";

const SettingsPage = () => {
  return (
    <Layout>
      <div className="container mx-auto py-8 space-y-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        
        <div className="space-y-6">
          <GeminiApiKeyForm />
          <SubscriptionSettings />
          <AffiliateSettings />
          <FeedbackForm />
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;