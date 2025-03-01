
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/stores/settingsStore";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import {
  Shield,
  Lock,
  Cloud,
  BarChart,
  Tag,
  RefreshCw,
  Download,
  Loader2,
  Clock
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabaseBackup } from "@/services/supabaseBackupService";

// Define the valid badge variant types to match the Badge component
type BadgeVariant = "default" | "outline" | "destructive" | "secondary" | "success" | "info" | "warning";

const PrivacySettings = () => {
  const settings = useSettings();
  const { user } = useAuth();
  const [confirmDisableBackup, setConfirmDisableBackup] = useState(false);
  const [confirmDisableDataCollection, setConfirmDisableDataCollection] = useState(false);
  const [syncInProgress, setSyncInProgress] = useState(false);

  const handleDataCollection = async (enabled: boolean) => {
    if (!enabled && !confirmDisableDataCollection) {
      setConfirmDisableDataCollection(true);
      return;
    }
    
    setConfirmDisableDataCollection(false);
    await settings.setDataCollection(enabled, user?.id);
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
    if (!enabled && !confirmDisableBackup) {
      setConfirmDisableBackup(true);
      return;
    }
    
    setConfirmDisableBackup(false);
    
    if (enabled && !user) {
      toast.error("You must be logged in to enable cloud backup");
      return;
    }
    
    await settings.setCloudBackupEnabled(enabled);
    
    if (enabled && user) {
      // Trigger a manual sync when enabling backup
      try {
        setSyncInProgress(true);
        await supabaseBackup.syncAll();
        toast.success("Settings backed up to cloud");
      } catch (error) {
        console.error("Error syncing to cloud:", error);
        toast.error("Failed to sync settings to cloud");
      } finally {
        setSyncInProgress(false);
      }
    } else {
      toast.success(`Cloud backup ${enabled ? 'enabled' : 'disabled'}`);
    }
  };

  const syncNow = async () => {
    if (!user || !settings.cloudBackupEnabled) {
      toast.error("Cloud backup must be enabled and you must be logged in");
      return;
    }
    
    try {
      setSyncInProgress(true);
      await supabaseBackup.syncAll();
      settings.syncSettingsWithServer(user.id);
      toast.success("Settings synced to cloud");
    } catch (error) {
      console.error("Error syncing to cloud:", error);
      toast.error("Failed to sync settings to cloud");
    } finally {
      setSyncInProgress(false);
    }
  };

  const restoreFromCloud = async () => {
    if (!user || !settings.cloudBackupEnabled) {
      toast.error("Cloud backup must be enabled and you must be logged in");
      return;
    }
    
    try {
      setSyncInProgress(true);
      await supabaseBackup.restoreFromBackup();
      await settings.fetchSettingsFromServer(user.id);
      toast.success("Settings restored from cloud");
    } catch (error) {
      console.error("Error restoring from cloud:", error);
      toast.error("Failed to restore settings from cloud");
    } finally {
      setSyncInProgress(false);
    }
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

  const renderSetting = (
    icon: React.ReactNode,
    title: string,
    description: string,
    isChecked: boolean,
    onChange: (value: boolean) => void,
    badge: { text: string; variant?: BadgeVariant } | null
  ) => (
    <div className="flex items-center justify-between py-3.5 border-b border-border/20 last:border-none">
      <div className="flex gap-3">
        <div className="mt-0.5 text-primary">{icon}</div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">{title}</Label>
            {badge && (
              <Badge 
                variant={badge.variant || "outline"} 
                className="text-[10px] h-4"
              >
                {badge.text}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <Switch
        checked={isChecked}
        onCheckedChange={onChange}
      />
    </div>
  );

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
      key="privacy-settings-container"
    >
      <Dialog open={confirmDisableDataCollection} onOpenChange={setConfirmDisableDataCollection}>
        <DialogContent className="sm:max-w-[425px] rounded-xl">
          <DialogHeader>
            <DialogTitle>Disable Data Collection?</DialogTitle>
            <DialogDescription>
              Disabling data collection will prevent us from gathering anonymous usage data that helps improve the application. This may affect certain features that rely on this data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setConfirmDisableDataCollection(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleDataCollection(false)}>Disable Data Collection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={confirmDisableBackup} onOpenChange={setConfirmDisableBackup}>
        <DialogContent className="sm:max-w-[425px] rounded-xl">
          <DialogHeader>
            <DialogTitle>Disable Cloud Backup?</DialogTitle>
            <DialogDescription>
              Disabling cloud backup will stop syncing your settings across devices. Your existing data will remain in the cloud but won't be updated. You can re-enable this feature anytime.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setConfirmDisableBackup(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleCloudBackup(false)}>Disable Cloud Backup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <motion.div variants={item} className="mb-3" key="privacy-heading">
        <h2 className="text-lg font-medium">Privacy & Data</h2>
        <p className="text-sm text-muted-foreground">Manage how your data is used</p>
      </motion.div>

      <motion.div variants={item} key="privacy-settings-card">
        <Card className="overflow-hidden border border-border/40 shadow-sm rounded-xl bg-card/30 backdrop-blur-sm">
          <CardContent className="p-0 divide-y divide-border/10">
            {renderSetting(
              <BarChart className="h-4 w-4" />,
              "Usage Analytics",
              "Help us improve with anonymous usage data",
              settings.dataCollection,
              handleDataCollection,
              null
            )}
            
            {renderSetting(
              <Tag className="h-4 w-4" />,
              "Affiliate Content",
              "Show relevant product recommendations",
              settings.affiliateBannersEnabled,
              handleAffiliateBannersEnabled,
              { text: "Sponsored", variant: "outline" }
            )}
            
            {renderSetting(
              <RefreshCw className="h-4 w-4" />,
              "Auto-detect Bookmarks",
              "Automatically scan for bookmark changes",
              settings.autoDetectBookmarks,
              settings.setAutoDetectBookmarks,
              null
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item} className="mb-3 mt-8" key="experimental-heading">
        <h2 className="text-lg font-medium">Experimental Features</h2>
        <p className="text-sm text-muted-foreground">Access to pre-release functionality</p>
      </motion.div>

      <motion.div variants={item} key="experimental-card">
        <Card className="overflow-hidden border border-border/40 shadow-sm rounded-xl bg-card/30 backdrop-blur-sm">
          <CardContent className="p-0">
            <div className="divide-y divide-border/10">
              {renderSetting(
                <Shield className="h-4 w-4" />,
                "Beta Features",
                "Enable experimental features and improvements",
                settings.experimentalFeatures,
                handleExperimentalFeatures,
                { text: "Beta", variant: "secondary" }
              )}
              
              {renderSetting(
                <Cloud className="h-4 w-4" />,
                "Cloud Backup",
                "Sync your data across devices",
                settings.cloudBackupEnabled,
                handleCloudBackup,
                { text: "New", variant: "secondary" }
              )}
            </div>
            
            {user && settings.cloudBackupEnabled && (
              <div className="p-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs h-8 rounded-lg shadow-sm"
                    onClick={syncNow}
                    disabled={syncInProgress}
                  >
                    {syncInProgress ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1.5" />
                        Sync Now
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs h-8 rounded-lg shadow-sm"
                    onClick={restoreFromCloud}
                    disabled={syncInProgress}
                  >
                    <Download className="h-3 w-3 mr-1.5" />
                    Restore
                  </Button>
                </div>
                
                {settings.lastSynced && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1.5" />
                    Last synced: {new Date(settings.lastSynced).toLocaleString()}
                  </div>
                )}
              </div>
            )}
            
            {!user && settings.cloudBackupEnabled === false && (
              <div className="px-4 pb-4">
                <Button variant="link" size="sm" className="text-xs h-auto p-0" asChild>
                  <Link to="/auth">
                    <Lock className="h-3 w-3 mr-1.5" />
                    Login required for cloud backup
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default PrivacySettings;
