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
  Clock,
  Database
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { localBackup } from "@/services/localBackupService";
import { useFeatureAccess } from "@/hooks/use-feature-access";
import DataSecuritySettings from "./DataSecuritySettings";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "info" | "warning";

interface SettingBadge {
  text: string;
  variant: BadgeVariant;
}

interface SettingProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  isChecked: boolean;
  onChange: (checked: boolean) => void;
  badge?: SettingBadge;
  disabled?: boolean;
}

const PrivacySettings = () => {
  const settings = useSettings();
  const { user, loading } = useAuth();
  const { checkAccess } = useFeatureAccess();
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

  const handleExperimentalFeatures = async (enabled: boolean) => {
    if (enabled && !(await checkAccess('experimental'))) {
      return;
    }
    
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
    
    if (enabled && !(await checkAccess('cloud_backup'))) {
      return;
    }
    
    await settings.setCloudBackupEnabled(enabled);
    
    if (enabled && user) {
      try {
        setSyncInProgress(true);
        await localBackup.syncAll();
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
      await localBackup.syncAll();
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
      await localBackup.restoreFromBackup();
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

  const Setting = ({ id, icon, title, description, isChecked, onChange, badge, disabled = false }: SettingProps) => (
    <div className="flex items-center justify-between py-4 border-b border-border/20 last:border-none">
      <div className="flex gap-3">
        <div className="mt-0.5 text-primary flex-shrink-0" aria-hidden="true">{icon}</div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Label htmlFor={id} className="text-sm font-medium cursor-pointer">
              {title}
            </Label>
            {badge && (
              <Badge 
                variant={badge.variant}
                className="text-[10px] h-4"
              >
                {badge.text}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground" id={`${id}-description`}>
            {description}
          </p>
        </div>
      </div>
      <Switch
        id={id}
        checked={isChecked}
        onCheckedChange={onChange}
        aria-label={`${title} ${isChecked ? 'enabled' : 'disabled'}`}
        aria-describedby={`${id}-description`}
        disabled={disabled}
      />
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
            <Setting
              id="data-collection"
              icon={<BarChart className="h-4 w-4" />}
              title="Usage Analytics"
              description="Help us improve with anonymous usage data"
              isChecked={settings.dataCollection}
              onChange={handleDataCollection}
            />
            
            <Setting
              id="affiliate-content"
              icon={<Tag className="h-4 w-4" />}
              title="Affiliate Content"
              description="Show relevant product recommendations"
              isChecked={settings.affiliateBannersEnabled}
              onChange={handleAffiliateBannersEnabled}
              badge={{ text: "Sponsored", variant: "outline" }}
            />
            
            <Setting
              id="auto-detect-bookmarks"
              icon={<RefreshCw className="h-4 w-4" />}
              title="Auto-detect Bookmarks"
              description="Automatically scan for bookmark changes"
              isChecked={settings.autoDetectBookmarks}
              onChange={settings.setAutoDetectBookmarks}
            />
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
              <Setting
                id="beta-features"
                icon={<Shield className="h-4 w-4" />}
                title="Beta Features"
                description="Enable experimental features and improvements"
                isChecked={settings.experimentalFeatures}
                onChange={handleExperimentalFeatures}
                badge={{ text: "Beta", variant: "secondary" }}
              />
              
              <Setting
                id="cloud-backup"
                icon={<Cloud className="h-4 w-4" />}
                title="Cloud Backup"
                description="Sync your data across devices"
                isChecked={settings.cloudBackupEnabled}
                onChange={handleCloudBackup}
                badge={{ text: "New", variant: "secondary" }}
              />
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
                    aria-label="Sync settings to cloud now"
                  >
                    {syncInProgress ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1.5 animate-spin" aria-hidden="true" />
                        <span>Syncing...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1.5" aria-hidden="true" />
                        <span>Sync Now</span>
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs h-8 rounded-lg shadow-sm"
                    onClick={restoreFromCloud}
                    disabled={syncInProgress}
                    aria-label="Restore settings from cloud"
                  >
                    <Download className="h-3 w-3 mr-1.5" aria-hidden="true" />
                    <span>Restore</span>
                  </Button>
                </div>
                
                {settings.lastSynced && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1.5" aria-hidden="true" />
                    <span>Last synced: {new Date(settings.lastSynced).toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}
            
            {!user && settings.cloudBackupEnabled === false && (
              <div className="px-4 pb-4">
                <Button 
                  variant="link" 
                  size="sm" 
                  className="text-xs h-auto p-0" 
                  asChild
                  aria-label="Login for cloud backup"
                >
                  <Link to="/auth">
                    <Lock className="h-3 w-3 mr-1.5" aria-hidden="true" />
                    <span>Login required for cloud backup</span>
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item} className="mb-3 mt-8" key="data-security-heading">
        <h2 className="text-lg font-medium flex items-center gap-2">
          <Database className="h-4 w-4 text-primary" />
          Data Security
        </h2>
        <p className="text-sm text-muted-foreground">
          Manage your data protection and privacy controls
        </p>
      </motion.div>

      <motion.div variants={item} key="data-security-settings">
        <DataSecuritySettings />
      </motion.div>
    </motion.div>
  );
};

export default PrivacySettings;
