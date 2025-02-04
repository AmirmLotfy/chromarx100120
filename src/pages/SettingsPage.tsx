import * as React from "react";
import Layout from "@/components/Layout";
import { useIsMobile } from "@/hooks/use-mobile";
import { useChromeAuth } from "@/contexts/ChromeAuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sun, User, RefreshCw, FileText, HelpCircle, Share2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AppearanceSettings from "@/components/settings/AppearanceSettings";
import PrivacySettings from "@/components/settings/PrivacySettings";
import AdvancedSettings from "@/components/settings/AdvancedSettings";
import LegalAndFeedback from "@/components/settings/LegalAndFeedback";
import SubscriptionDetails from "@/components/settings/SubscriptionDetails";
import AccountSettings from "@/components/settings/AccountSettings";
import AffiliateSettings from "@/components/settings/AffiliateSettings";
import ShareSettings from "@/components/settings/ShareSettings";
import RatingPrompt from "@/components/settings/RatingPrompt";
import BookmarkAutoDetection from "@/components/settings/BookmarkAutoDetection";

const SettingsPage = () => {
  const isMobile = useIsMobile();
  const { isAdmin } = useChromeAuth();
  const [activeTab, setActiveTab] = React.useState("appearance");

  const tabs = [
    { value: "appearance", label: "Appearance", icon: Sun },
    { value: "privacy", label: "Privacy", icon: User },
    { value: "subscription", label: "Subscription", icon: RefreshCw },
    { value: "account", label: "Account", icon: User },
    { value: "advanced", label: "Advanced", icon: RefreshCw },
    { value: "share", label: "Share & Support", icon: Share2 },
    { value: "legal", label: "Legal & Feedback", icon: FileText },
  ];

  if (isAdmin) {
    tabs.push({ value: "affiliate", label: "Affiliate", icon: HelpCircle });
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 h-full flex flex-col">
        <div className="space-y-2 flex-shrink-0">
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your preferences and customize your experience
          </p>
        </div>

        <RatingPrompt />

        <div className="flex-1 overflow-hidden mt-4">
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="h-full flex flex-col"
          >
            {isMobile ? (
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="w-full mb-4">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-md w-[280px]">
                  {tabs.map((tab) => (
                    <SelectItem key={tab.value} value={tab.value}>
                      <div className="flex items-center gap-2">
                        <tab.icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-7 mb-4">
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            )}

            <div className="flex-1 overflow-y-auto pb-16 max-w-[1400px] mx-auto w-full">
              <TabsContent value="appearance" className="space-y-4">
                <AppearanceSettings />
              </TabsContent>

              <TabsContent value="privacy" className="space-y-4">
                <PrivacySettings />
                <BookmarkAutoDetection />
              </TabsContent>

              <TabsContent value="subscription" className="space-y-4">
                <SubscriptionDetails />
              </TabsContent>

              <TabsContent value="account" className="space-y-4">
                <AccountSettings />
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <AdvancedSettings />
              </TabsContent>

              <TabsContent value="share" className="space-y-4">
                <ShareSettings />
              </TabsContent>

              <TabsContent value="legal" className="space-y-4">
                <LegalAndFeedback />
              </TabsContent>

              {isAdmin && (
                <TabsContent value="affiliate">
                  <AffiliateSettings />
                </TabsContent>
              )}
            </div>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
