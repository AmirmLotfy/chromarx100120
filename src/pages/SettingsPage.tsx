
import React, { useState } from "react";
import Layout from "@/components/Layout";
import { Shield, Bell, PaintBucket, FileText, User, ChevronRight, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { useSettings } from "@/stores/settingsStore";
import AppearanceSettings from "@/components/settings/AppearanceSettings";
import LegalAndFeedback from "@/components/settings/LegalAndFeedback";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PrivacySettings from "@/components/settings/PrivacySettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import { useTheme } from "next-themes";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("appearance");
  const settings = useSettings();
  const { theme } = useTheme();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 h-full flex flex-col">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-1 flex-shrink-0 pt-2"
        >
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Customize your experience
          </p>
        </motion.div>

        <div className="flex-1 overflow-hidden mt-6 pb-16">
          <Tabs defaultValue="appearance" className="h-full flex flex-col" 
            value={activeTab} 
            onValueChange={setActiveTab}
          >
            <TabsList className="justify-start overflow-x-auto px-0 h-12 w-full bg-transparent space-x-2 mb-6">
              {[
                { value: "appearance", label: "Appearance", icon: <PaintBucket className="h-4 w-4" /> },
                { value: "privacy", label: "Privacy", icon: <Shield className="h-4 w-4" /> },
                { value: "notifications", label: "Alerts", icon: <Bell className="h-4 w-4" /> },
                { value: "legal", label: "Legal", icon: <FileText className="h-4 w-4" /> }
              ].map((tab) => (
                <TabsTrigger 
                  key={tab.value} 
                  value={tab.value}
                  className={cn(
                    "data-[state=active]:bg-primary/10 data-[state=active]:text-primary",
                    "rounded-full px-4 py-2 flex items-center gap-2 text-sm",
                    "transition-all duration-200"
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="flex-1 overflow-y-auto max-w-[550px] mx-auto w-full pb-8">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <TabsContent value="appearance" className="mt-0">
                  <AppearanceSettings />
                </TabsContent>

                <TabsContent value="privacy" className="mt-0">
                  <PrivacySettings />
                </TabsContent>

                <TabsContent value="notifications" className="mt-0">
                  <NotificationSettings />
                </TabsContent>

                <TabsContent value="legal" className="mt-0">
                  <LegalAndFeedback />
                </TabsContent>
              </motion.div>
            </div>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
