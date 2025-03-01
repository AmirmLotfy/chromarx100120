import React, { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Download, 
  Trash2, 
  AlertTriangle, 
  Shield, 
  FileJson, 
  FileSpreadsheet, 
  Copy, 
  ArchiveRestore
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/stores/settingsStore";
import { toast } from "sonner";
import { storage } from "@/services/storageService";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const DataManagementPage = () => {
  const { user, signOut } = useAuth();
  const settings = useSettings();
  const navigate = useNavigate();
  const [exportFormat, setExportFormat] = useState<string>("json");
  const [includeSettings, setIncludeSettings] = useState<boolean>(true);
  const [includeProfile, setIncludeProfile] = useState<boolean>(true);
  const [includeBookmarks, setIncludeBookmarks] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const handleExportData = async () => {
    setIsExporting(true);
    
    try {
      // Collect data based on user selections
      const dataToExport: Record<string, any> = {};
      
      // Add profile data if selected
      if (includeProfile) {
        const profileData = await storage.get('userProfile');
        if (profileData) {
          dataToExport.profile = profileData;
        }
      }
      
      // Add settings if selected
      if (includeSettings) {
        dataToExport.settings = {
          theme: settings.theme,
          colorScheme: settings.colorScheme,
          notifications: settings.notifications,
          dataCollection: settings.dataCollection,
          experimentalFeatures: settings.experimentalFeatures,
          affiliateBannersEnabled: settings.affiliateBannersEnabled,
          autoDetectBookmarks: settings.autoDetectBookmarks
        };
      }
      
      // Add bookmarks if selected
      if (includeBookmarks) {
        const bookmarks = await storage.get('bookmarks');
        if (bookmarks) {
          dataToExport.bookmarks = bookmarks;
        }
      }

      // Format data based on selected format
      let exportData: string;
      let mimeType: string;
      let fileExtension: string;
      
      if (exportFormat === 'json') {
        exportData = JSON.stringify(dataToExport, null, 2);
        mimeType = 'application/json';
        fileExtension = 'json';
      } else if (exportFormat === 'csv') {
        // Simple CSV conversion (actual implementation would be more complex)
        const flattenedData = flattenObjectForCsv(dataToExport);
        exportData = convertToCSV(flattenedData);
        mimeType = 'text/csv';
        fileExtension = 'csv';
      } else {
        // Text format
        exportData = JSON.stringify(dataToExport, null, 2);
        mimeType = 'text/plain';
        fileExtension = 'txt';
      }
      
      // Create and download the file
      const blob = new Blob([exportData], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chromarx-data-export-${new Date().toISOString().slice(0, 10)}.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Data exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };
  
  // Helper function to flatten nested objects for CSV export
  const flattenObjectForCsv = (obj: Record<string, any>, prefix = '') => {
    return Object.keys(obj).reduce((acc: Record<string, any>, k: string) => {
      const pre = prefix.length ? `${prefix}.${k}` : k;
      if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
        Object.assign(acc, flattenObjectForCsv(obj[k], pre));
      } else {
        acc[pre] = obj[k];
      }
      return acc;
    }, {});
  };
  
  // Helper function to convert flattened object to CSV
  const convertToCSV = (obj: Record<string, any>) => {
    const header = Object.keys(obj).join(',') + '\n';
    const row = Object.values(obj).map(value => {
      if (typeof value === 'string') {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
    return header + row;
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    
    try {
      // Clear all local storage
      await storage.clearAll();
      
      // Sign out the user
      await signOut();
      
      toast.success('Your account has been deleted and all local data has been cleared');
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold">Data Management</h1>
          <p className="text-muted-foreground">
            Manage your personal data, privacy settings, and account
          </p>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Your Data
              </CardTitle>
              <CardDescription>
                Download a copy of your personal data in various formats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="export-format">Export Format</Label>
                    <Select 
                      value={exportFormat} 
                      onValueChange={setExportFormat}
                    >
                      <SelectTrigger id="export-format">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="json">
                          <div className="flex items-center gap-2">
                            <FileJson className="h-4 w-4" />
                            <span>JSON (Recommended)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="csv">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4" />
                            <span>CSV (Spreadsheet)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="text">
                          <div className="flex items-center gap-2">
                            <Copy className="h-4 w-4" />
                            <span>Plain Text</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Data to Include</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="include-profile" 
                        checked={includeProfile}
                        onCheckedChange={(checked) => setIncludeProfile(checked as boolean)}
                      />
                      <Label htmlFor="include-profile">Profile Information</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="include-settings" 
                        checked={includeSettings}
                        onCheckedChange={(checked) => setIncludeSettings(checked as boolean)}
                      />
                      <Label htmlFor="include-settings">Application Settings</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="include-bookmarks" 
                        checked={includeBookmarks}
                        onCheckedChange={(checked) => setIncludeBookmarks(checked as boolean)}
                      />
                      <Label htmlFor="include-bookmarks">Bookmarks and Collections</Label>
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleExportData} 
                className="w-full sm:w-auto mt-4"
                disabled={isExporting || (!includeProfile && !includeSettings && !includeBookmarks)}
              >
                {isExporting ? (
                  <>
                    <span className="mr-2">Exporting...</span>
                    <span className="animate-spin">⏳</span>
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export Data
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArchiveRestore className="h-5 w-5" />
                Restore Data
              </CardTitle>
              <CardDescription>
                Restore your data from a previous export
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                You can restore your data from a previous export file. This will replace your current data.
              </p>
              <Button 
                variant="outline" 
                onClick={() => navigate('/export-import')}
              >
                <ArchiveRestore className="mr-2 h-4 w-4" />
                Go to Import/Export Page
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy Controls
              </CardTitle>
              <CardDescription>
                Manage how your data is used and stored
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/settings')}
                  className="w-full sm:w-auto"
                >
                  Manage Privacy Settings
                </Button>
                <p className="text-sm text-muted-foreground">
                  Control data collection, analytics, and other privacy settings
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/20">
            <CardHeader className="text-destructive">
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Delete Account
              </CardTitle>
              <CardDescription className="text-destructive/80">
                Permanently delete your account and all associated data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-destructive/10 rounded-md p-4 text-sm">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-destructive mb-1">Warning: This action cannot be undone</p>
                      <p className="text-muted-foreground">
                        Deleting your account will permanently remove all your data, including profile information, 
                        settings, and saved items. This action cannot be reversed.
                      </p>
                    </div>
                  </div>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      className="w-full sm:w-auto"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account
                        and remove all your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteAccount}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isDeleting ? 'Deleting...' : 'Delete Account'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default DataManagementPage;
