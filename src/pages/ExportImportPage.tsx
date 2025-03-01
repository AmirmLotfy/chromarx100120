
import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookmarkImport } from "@/components/BookmarkImport";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, FileUp, HardDrive, Upload, Box, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const ExportImportPage = () => {
  const { user } = useAuth();
  const [exportFormat, setExportFormat] = useState("json");
  const [includeContent, setIncludeContent] = useState(true);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeCategories, setIncludeCategories] = useState(true);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [restoreInProgress, setRestoreInProgress] = useState(false);

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

  const handleBackup = () => {
    setBackupInProgress(true);
    toast.info("Backing up all data to cloud storage...");
    
    // Simulate a backup process
    setTimeout(() => {
      setBackupInProgress(false);
      toast.success("Backup completed successfully");
    }, 2000);
  };

  const handleRestore = () => {
    setRestoreInProgress(true);
    toast.info("Restoring data from cloud backup...");
    
    // Simulate a restore process
    setTimeout(() => {
      setRestoreInProgress(false);
      toast.success("Restore completed successfully");
    }, 2000);
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
                          <Box className="h-8 w-8 text-primary mb-2" />
                          <h3 className="font-medium mb-1">Restore Data</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Restore your bookmarks and settings from a backup
                          </p>
                          <Button 
                            onClick={handleRestore} 
                            variant="outline" 
                            className="w-full"
                            disabled={restoreInProgress}
                          >
                            {restoreInProgress ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Restoring...
                              </>
                            ) : (
                              <>
                                <FileUp className="h-4 w-4 mr-2" />
                                Restore Data
                              </>
                            )}
                          </Button>
                        </div>
                      </Card>
                    </div>
                    
                    <div className="mt-4 p-3 bg-muted/50 rounded-md">
                      <h4 className="text-sm font-medium mb-1">Last Backup</h4>
                      <p className="text-xs text-muted-foreground">
                        No recent backups found. Creating a backup now will save all your data to your account storage.
                      </p>
                    </div>
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
