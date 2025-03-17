import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookmarkImport } from "@/components/BookmarkImport";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, FileUp, HardDrive, Upload, Box, RefreshCw, Trash2, History, Clock, Cloud } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabaseBackup } from "@/services/supabaseBackupService";
import { format } from "date-fns";
import { syncService } from "@/services/syncService";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useSettings } from "@/stores/settingsStore";

type BackupEntry = {
  timestamp: string;
  size: number;
  type: 'local' | 'cloud';
  conflicts?: number;
};

export const fetchConflicts = async () => {
  // Implementation for fetching conflicts
  return [];
};

const ConflictResolutionDialog = ({ 
  open, 
  onOpenChange,
  conflicts,
  onResolveAll
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  conflicts: any[];
  onResolveAll: (strategy: 'local' | 'remote') => void;
}) => {
  const [strategy, setStrategy] = useState<'local' | 'remote'>('local');
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Resolve Sync Conflicts</DialogTitle>
          <DialogDescription>
            {conflicts.length} items have conflicts between local and remote versions. 
            Choose how to resolve them.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <RadioGroup value={strategy} onValueChange={(v) => setStrategy(v as 'local' | 'remote')} className="space-y-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="local" id="local" />
              <Label htmlFor="local">Keep my local changes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="remote" id="remote" />
              <Label htmlFor="remote">Use remote versions</Label>
            </div>
          </RadioGroup>
          
          <div className="bg-muted/50 p-3 rounded-md text-sm">
            <p className="text-muted-foreground">
              {strategy === 'local' 
                ? "Your local changes will be synchronized to the cloud, overwriting remote versions." 
                : "Remote versions will replace your local changes."}
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => {
            onResolveAll(strategy);
            onOpenChange(false);
          }}>Resolve All Conflicts</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ExportImportPage = () => {
  const { user } = useAuth();
  const settings = useSettings();
  const [exportFormat, setExportFormat] = useState("json");
  const [includeContent, setIncludeContent] = useState(true);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeCategories, setIncludeCategories] = useState(true);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [restoreInProgress, setRestoreInProgress] = useState(false);
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [selectedBackup, setSelectedBackup] = useState<BackupEntry | null>(null);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [conflicts, setConflicts] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadBackups();
    }
  }, [user]);

  const loadBackups = async () => {
    try {
      // Get local backups
      const localBackups = await supabaseBackup.listLocalBackups();
      const localEntries: BackupEntry[] = localBackups.map(b => ({
        ...b,
        type: 'local' as const
      }));
      
      // Get cloud backups
      const cloudBackups: BackupEntry[] = [];
      if (user) {
        // We would need to implement this in the supabaseBackup service
        // For now, just show a single cloud backup entry if enabled
        if (settings.cloudBackupEnabled && settings.lastSynced) {
          cloudBackups.push({
            timestamp: settings.lastSynced,
            size: 0, // Size unknown from server
            type: 'cloud',
            conflicts: await syncService.getConflictCount()
          });
        }
      }
      
      // Combine and sort by timestamp (newest first)
      const allBackups = [...localEntries, ...cloudBackups]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setBackups(allBackups);
    } catch (error) {
      console.error('Error loading backups:', error);
    }
  };

  const handleExport = () => {
    // In a real app, this would trigger an actual export
    toast.info(`Exporting bookmarks as ${exportFormat.toUpperCase()}...`);
    setTimeout(() => {
      toast.success("Export complete! Check your downloads folder.");
    }, 1500);
  };

  const handleImport = (bookmarks: any[]) => {
    toast.success(`Imported ${bookmarks.length} bookmarks successfully`);
  };

  const handleBackup = async () => {
    setBackupInProgress(true);
    toast.info("Backing up all data to cloud storage...");
    
    try {
      // First create a local backup
      await supabaseBackup.createLocalBackup();
      
      // Then sync to cloud if user is logged in
      if (user) {
        await supabaseBackup.syncAll();
      }
      
      toast.success("Backup completed successfully");
      loadBackups();
    } catch (error) {
      console.error('Backup error:', error);
      toast.error("Failed to complete backup");
    } finally {
      setBackupInProgress(false);
    }
  };

  const handleRestore = async (backup: BackupEntry) => {
    setRestoreInProgress(true);
    setSelectedBackup(backup);
    
    try {
      if (backup.type === 'local') {
        const success = await supabaseBackup.restoreFromLocalBackup(backup.timestamp);
        if (success) {
          toast.success("Successfully restored from local backup");
        }
      } else {
        // Check for conflicts first
        const conflictCount = await syncService.getConflictCount();
        
        if (conflictCount > 0) {
          // Show conflict resolution dialog
          const conflictItems = await syncService.getConflicts();
          setConflicts(conflictItems);
          setConflictDialogOpen(true);
          return;
        }
        
        await supabaseBackup.restoreFromBackup(backup.timestamp);
        toast.success("Successfully restored from cloud backup");
      }
    } catch (error) {
      console.error('Restore error:', error);
      toast.error("Failed to restore from backup");
    } finally {
      setRestoreInProgress(false);
    }
  };

  const handleDeleteBackup = async (backup: BackupEntry) => {
    try {
      if (backup.type === 'local') {
        // Implement local backup deletion
        await chrome.storage.local.remove(`backup_${backup.timestamp}`);
        toast.success("Local backup deleted");
      } else {
        await supabaseBackup.deleteBackup(backup.timestamp);
      }
      
      // Refresh the list
      loadBackups();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error("Failed to delete backup");
    }
  };

  const handleResolveAllConflicts = async () => {
    try {
      await syncService.resolveAllConflicts();
      fetchConflicts();
    } catch (error) {
      console.error('Error resolving conflicts:', error);
      toast.error('Failed to resolve conflicts');
    }
  };

  const formatDate = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return timestamp;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return 'Unknown';
    const units = ['bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <Box className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Export & Import</h1>
        </div>

        <Tabs defaultValue="export">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
            <TabsTrigger value="backup">Cloud Backup</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Export Bookmarks</CardTitle>
                <CardDescription>
                  Download your bookmarks and data in various formats
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Export Format</Label>
                  <RadioGroup 
                    value={exportFormat} 
                    onValueChange={setExportFormat}
                    className="flex flex-col space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="json" id="json" />
                      <Label htmlFor="json" className="font-normal cursor-pointer">JSON (Recommended)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="csv" id="csv" />
                      <Label htmlFor="csv" className="font-normal cursor-pointer">CSV (Excel compatible)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="html" id="html" />
                      <Label htmlFor="html" className="font-normal cursor-pointer">HTML (Chrome compatible)</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label>Export Options</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="includeContent" 
                        checked={includeContent}
                        onCheckedChange={(checked) => setIncludeContent(checked as boolean)}
                      />
                      <Label 
                        htmlFor="includeContent" 
                        className="font-normal cursor-pointer"
                      >
                        Include bookmark content
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="includeMetadata" 
                        checked={includeMetadata}
                        onCheckedChange={(checked) => setIncludeMetadata(checked as boolean)}
                      />
                      <Label 
                        htmlFor="includeMetadata" 
                        className="font-normal cursor-pointer"
                      >
                        Include metadata (tags, descriptions)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="includeCategories" 
                        checked={includeCategories}
                        onCheckedChange={(checked) => setIncludeCategories(checked as boolean)}
                      />
                      <Label 
                        htmlFor="includeCategories" 
                        className="font-normal cursor-pointer"
                      >
                        Include categories and folders
                      </Label>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleExport} 
                  className="w-full sm:w-auto"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Bookmarks
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="import" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Import Bookmarks</CardTitle>
                <CardDescription>
                  Import bookmarks from Chrome, Firefox, or other bookmark managers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BookmarkImport onImportComplete={handleImport} />
                
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-base font-medium mb-2">Compatible Formats</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    ChroMarx can import bookmarks from these formats:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                    <li>Chrome/Edge/Brave HTML exports</li>
                    <li>Firefox JSON exports</li>
                    <li>CSV files with URL and title columns</li>
                    <li>ChroMarx JSON exports</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="backup" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cloud Backup & Restore</CardTitle>
                <CardDescription>
                  {user ? "Backup and restore all your data to your account's cloud storage" : "Sign in to use cloud backup features"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {user ? (
                  <>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Card className="flex-1 p-4 border border-border/50">
                        <div className="flex flex-col items-center text-center p-4">
                          <HardDrive className="h-8 w-8 text-primary mb-2" />
                          <h3 className="font-medium mb-1">Backup Data</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Create a complete backup of all your bookmarks and settings
                          </p>
                          <Button 
                            onClick={handleBackup} 
                            className="w-full"
                            disabled={backupInProgress}
                          >
                            {backupInProgress ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Backing up...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Start Backup
                              </>
                            )}
                          </Button>
                        </div>
                      </Card>
                      
                      <Card className="flex-1 p-4 border border-border/50">
                        <div className="flex flex-col items-center text-center p-4">
                          <Clock className="h-8 w-8 text-primary mb-2" />
                          <h3 className="font-medium mb-1">Scheduled Backups</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Configure automatic backup frequency
                          </p>
                          <div className="w-full mb-4">
                            <div className="flex items-center gap-2">
                              <Checkbox 
                                id="enableCloudBackup"
                                checked={settings.cloudBackupEnabled}
                                onCheckedChange={(checked) => {
                                  settings.setCloudBackupEnabled(checked as boolean);
                                  if (checked) {
                                    toast.success("Automatic backups enabled");
                                  }
                                }}
                              />
                              <Label htmlFor="enableCloudBackup">Enable automatic backups</Label>
                            </div>
                            {settings.cloudBackupEnabled && settings.lastSynced && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Last backup: {formatDate(settings.lastSynced)}
                              </p>
                            )}
                          </div>
                        </div>
                      </Card>
                    </div>
                    
                    <h3 className="text-lg font-medium mt-6">Backup History</h3>
                    <Card>
                      <ScrollArea className="h-[320px] w-full rounded-md border">
                        {backups.length > 0 ? (
                          <div className="p-4">
                            {backups.map((backup, index) => (
                              <div 
                                key={`${backup.type}-${backup.timestamp}`}
                                className={`flex items-center justify-between py-3 ${
                                  index !== backups.length - 1 ? 'border-b border-border/40' : ''
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  {backup.type === 'local' ? (
                                    <HardDrive className="h-5 w-5 text-muted-foreground" />
                                  ) : (
                                    <Cloud className="h-5 w-5 text-primary" />
                                  )}
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium">
                                        {formatDate(backup.timestamp)}
                                      </span>
                                      <Badge variant={backup.type === 'local' ? 'outline' : 'default'} className="text-[10px] py-0 px-1.5">
                                        {backup.type}
                                      </Badge>
                                      {backup.conflicts && backup.conflicts > 0 && (
                                        <Badge variant="destructive" className="text-[10px] py-0 px-1.5">
                                          {backup.conflicts} conflicts
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      {backup.type === 'local' ? formatSize(backup.size) : 'Cloud storage'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    disabled={restoreInProgress}
                                    onClick={() => handleRestore(backup)}
                                  >
                                    {restoreInProgress && selectedBackup?.timestamp === backup.timestamp ? (
                                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <History className="h-3.5 w-3.5" />
                                    )}
                                    <span className="ml-1.5 sr-only sm:not-sr-only">Restore</span>
                                  </Button>
                                  
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                        <Trash2 className="h-3.5 w-3.5" />
                                        <span className="ml-1.5 sr-only sm:not-sr-only">Delete</span>
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Backup</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete this backup from {backup.type === 'local' ? 'local storage' : 'cloud storage'}? 
                                          This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={() => handleDeleteBackup(backup)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full py-8">
                            <div className="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center mb-3">
                              <History className="h-6 w-6 text-muted-foreground/50" />
                            </div>
                            <p className="text-sm text-muted-foreground">No backups found</p>
                            <p className="text-xs text-muted-foreground/70 max-w-[250px] text-center mt-1">
                              Use the "Start Backup" button to create your first backup
                            </p>
                          </div>
                        )}
                      </ScrollArea>
                    </Card>

                    <ConflictResolutionDialog 
                      open={conflictDialogOpen} 
                      onOpenChange={setConflictDialogOpen}
                      conflicts={conflicts}
                      onResolveAll={handleResolveAllConflicts}
                    />
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <HardDrive className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Sign in required</h3>
                    <p className="text-center text-muted-foreground mb-4">
                      You need to sign in to use cloud backup and restore features
                    </p>
                    <Button variant="default">Sign In</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ExportImportPage;
