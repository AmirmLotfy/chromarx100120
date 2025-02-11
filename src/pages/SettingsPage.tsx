
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sun, FileText } from "lucide-react";
import AppearanceSettings from "@/components/settings/AppearanceSettings";
import LegalAndFeedback from "@/components/settings/LegalAndFeedback";

const SettingsPage = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 h-full flex flex-col">
        <div className="space-y-2 flex-shrink-0">
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your preferences and customize your experience
          </p>
        </div>

        <div className="flex-1 overflow-hidden mt-4">
          <Tabs defaultValue="appearance" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="appearance">
                <Sun className="mr-2 h-4 w-4" />
                Appearance
              </TabsTrigger>
              <TabsTrigger value="legal">
                <FileText className="mr-2 h-4 w-4" />
                Legal & Feedback
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto pb-16 max-w-[1400px] mx-auto w-full">
              <TabsContent value="appearance" className="space-y-4">
                <AppearanceSettings />
              </TabsContent>

              <TabsContent value="legal" className="space-y-4">
                <LegalAndFeedback />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
