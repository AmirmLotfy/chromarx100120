import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ThemeSettings from "@/components/settings/ThemeSettings";
import SubscriptionSettings from "@/components/settings/SubscriptionSettings";
import LegalAndFeedback from "@/components/settings/LegalAndFeedback";

const SettingsPage = () => {
  return (
    <Layout>
      <div className="space-y-6 px-4 md:px-6 pb-20 md:pb-6 pt-6 md:pt-8">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Customize your experience and manage your account
          </p>
        </div>
        <Tabs defaultValue="theme" className="space-y-4">
          <TabsList>
            <TabsTrigger value="theme">Theme</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="legal">Legal & Feedback</TabsTrigger>
          </TabsList>
          <TabsContent value="theme">
            <ThemeSettings />
          </TabsContent>
          <TabsContent value="subscription">
            <SubscriptionSettings />
          </TabsContent>
          <TabsContent value="legal">
            <LegalAndFeedback />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default SettingsPage;