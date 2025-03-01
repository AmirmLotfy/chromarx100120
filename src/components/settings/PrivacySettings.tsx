
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/stores/settingsStore";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

const PrivacySettings = () => {
  const settings = useSettings();
  const { user } = useAuth();

  const handleDataCollection = (enabled: boolean) => {
    settings.setDataCollection(enabled, user?.id);
    toast.success(`Data collection ${enabled ? 'enabled' : 'disabled'}`);
  };

  const handleExperimentalFeatures = (enabled: boolean) => {
    settings.setExperimentalFeatures(enabled);
    toast.success(`Experimental features ${enabled ? 'enabled' : 'disabled'}`);
  };

  const handleAffiliateBannersEnabled = (enabled: boolean) => {
    settings.setAffiliateBannersEnabled(enabled);
    toast.success(`Affiliate content ${enabled ? 'enabled' : 'disabled'}`);
  };

  const handleCloudBackup = async (enabled: boolean) => {
    if (enabled && !user) {
      toast.error("You must be logged in to enable cloud backup");
      return;
    }
    
    await settings.setCloudBackupEnabled(enabled);
    toast.success(`Cloud backup ${enabled ? 'enabled' : 'disabled'}`);
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      <motion.div variants={item}>
        <Card className="overflow-hidden border border-border/40 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Data & Privacy</CardTitle>
            <CardDescription>Manage how your data is used</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Usage Analytics</Label>
                <p className="text-xs text-muted-foreground">
                  Help us improve with anonymous usage data
                </p>
              </div>
              <Switch
                checked={settings.dataCollection}
                onCheckedChange={handleDataCollection}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Affiliate Content</Label>
                  <Badge variant="outline" className="text-[10px] h-4">Sponsored</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Show relevant product recommendations
                </p>
              </div>
              <Switch
                checked={settings.affiliateBannersEnabled}
                onCheckedChange={handleAffiliateBannersEnabled}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Auto-detect Bookmarks</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Automatically scan for bookmark changes
                </p>
              </div>
              <Switch
                checked={settings.autoDetectBookmarks}
                onCheckedChange={settings.setAutoDetectBookmarks}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="overflow-hidden border border-border/40 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Experimental Features</CardTitle>
            <CardDescription>Access to pre-release functionality</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Beta Features</Label>
                  <Badge className="bg-amber-500/20 text-amber-600 text-[10px] h-4 border-none">Beta</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enable experimental features and improvements
                </p>
              </div>
              <Switch
                checked={settings.experimentalFeatures}
                onCheckedChange={handleExperimentalFeatures}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Cloud Backup</Label>
                  <Badge className="bg-blue-500/20 text-blue-600 text-[10px] h-4 border-none">New</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Sync your data across devices
                </p>
                {!user && settings.cloudBackupEnabled === false && (
                  <div className="mt-1">
                    <Button variant="link" size="sm" className="text-xs h-auto p-0" asChild>
                      <Link to="/auth">Login required</Link>
                    </Button>
                  </div>
                )}
              </div>
              <Switch
                checked={settings.cloudBackupEnabled}
                onCheckedChange={handleCloudBackup}
                disabled={!user && !settings.cloudBackupEnabled}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default PrivacySettings;
