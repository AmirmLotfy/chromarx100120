import React from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSettings } from "@/stores/settingsStore";
import AppearanceSettings from "@/components/settings/AppearanceSettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import PrivacySettings from "@/components/settings/PrivacySettings";
import DataSecuritySettings from "@/components/settings/DataSecuritySettings";
import LegalAndFeedback from "@/components/settings/LegalAndFeedback";
import OfflineSettings from "@/components/settings/OfflineSettings";
import {
  Settings2,
  Palette,
  Bell,
  Shield,
  FileText,
  RotateCcw,
  Database,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";

const SettingsPage = () => {
  const { reset } = useSettings();

  const handleResetSettings = () => {
    reset();
    toast.success("Settings reset to default");
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4 max-w-5xl">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <Settings2 className="h-7 w-7 text-primary" />
          Settings
        </h1>
        
        <Tabs defaultValue="appearance" className="space-y-4">
          <TabsList className="h-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 bg-background">
            <TabsTrigger value="appearance" className="data-[state=active]:bg-muted px-3 py-2 h-auto">
              <Palette className="h-4 w-4 mr-2" />
              <span>Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-muted px-3 py-2 h-auto">
              <Bell className="h-4 w-4 mr-2" />
              <span>Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="data-[state=active]:bg-muted px-3 py-2 h-auto">
              <Shield className="h-4 w-4 mr-2" />
              <span>Privacy</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="data-[state=active]:bg-muted px-3 py-2 h-auto">
              <Database className="h-4 w-4 mr-2" />
              <span>Data Security</span>
            </TabsTrigger>
            <TabsTrigger value="offline" className="data-[state=active]:bg-muted px-3 py-2 h-auto">
              <WifiOff className="h-4 w-4 mr-2" />
              <span>Offline & Sync</span>
            </TabsTrigger>
            <TabsTrigger value="legal" className="data-[state=active]:bg-muted px-3 py-2 h-auto">
              <FileText className="h-4 w-4 mr-2" />
              <span>Legal & Feedback</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="appearance" className="mt-6">
            <AppearanceSettings />
          </TabsContent>
          
          <TabsContent value="notifications" className="mt-6">
            <NotificationSettings />
          </TabsContent>
          
          <TabsContent value="privacy" className="mt-6">
            <PrivacySettings />
          </TabsContent>
          
          <TabsContent value="data" className="mt-6">
            <DataSecuritySettings />
          </TabsContent>
          
          <TabsContent value="offline" className="mt-6">
            <OfflineSettings />
          </TabsContent>
          
          <TabsContent value="legal" className="mt-6">
            <LegalAndFeedback />
          </TabsContent>
        </Tabs>
        
        <div className="mt-8 pt-4 border-t flex justify-between items-center">
          <div>
            <h2 className="text-lg font-medium mb-1">Reset All Settings</h2>
            <p className="text-sm text-muted-foreground">
              Reset all settings to their original defaults
            </p>
          </div>
          <DialogTrigger asChild>
            <Button variant="destructive">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Settings
            </Button>
          </DialogTrigger>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
