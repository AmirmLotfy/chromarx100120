
import React, { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabaseBackup } from "@/services/supabaseBackupService";

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

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      {/* Confirmation Dialog for Disabling Data Collection */}
      <Dialog open={confirmDisableDataCollection} onOpenChange={setConfirmDisableDataCollection}>
        <DialogContent className="sm:max-w-[425px]">
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
      
      {/* Confirmation Dialog for Disabling Cloud Backup */}
      <Dialog open={confirmDisableBackup} onOpenChange={setConfirmDisableBackup}>
        <DialogContent className="sm:max-w-[425px]">
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
            
            {user && settings.cloudBackupEnabled && (
              <div className="pt-2 flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs"
                  onClick={syncNow}
                  disabled={syncInProgress}
                >
                  {syncInProgress ? "Syncing..." : "Sync Now"}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs"
                  onClick={restoreFromCloud}
                  disabled={syncInProgress}
                >
                  Restore from Cloud
                </Button>
              </div>
            )}
            
            {settings.lastSynced && settings.cloudBackupEnabled && (
              <p className="text-xs text-muted-foreground mt-1">
                Last synced: {new Date(settings.lastSynced).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default PrivacySettings;
