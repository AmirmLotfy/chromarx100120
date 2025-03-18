
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Trash2, Download, Upload, Shield } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { localBackup } from "@/services/localBackupService";

const PrivacySettings = () => {
  const [isDataCollectionEnabled, setIsDataCollectionEnabled] = useState(
    localStorage.getItem('enableDataCollection') !== 'false'
  );
  const [isAnalyticsEnabled, setIsAnalyticsEnabled] = useState(
    localStorage.getItem('enableAnalytics') !== 'false'
  );
  const [isEraseDialogOpen, setIsEraseDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [exportData, setExportData] = useState<string | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDataCollectionToggle = () => {
    const newValue = !isDataCollectionEnabled;
    setIsDataCollectionEnabled(newValue);
    localStorage.setItem('enableDataCollection', newValue.toString());
    toast.success(`Data collection ${newValue ? 'enabled' : 'disabled'}`);
  };

  const handleAnalyticsToggle = () => {
    const newValue = !isAnalyticsEnabled;
    setIsAnalyticsEnabled(newValue);
    localStorage.setItem('enableAnalytics', newValue.toString());
    toast.success(`Analytics ${newValue ? 'enabled' : 'disabled'}`);
  };

  const handleEraseAllData = () => {
    setIsProcessing(true);
    
    // Simulate processing delay
    setTimeout(() => {
      // Clear all local storage
      localStorage.clear();
      
      // Close dialog and show success message
      setIsEraseDialogOpen(false);
      setIsProcessing(false);
      toast.success('All data has been erased');
      
      // Reset toggles
      setIsDataCollectionEnabled(true);
      setIsAnalyticsEnabled(true);
    }, 1500);
  };

  const handleExportData = () => {
    setIsProcessing(true);
    
    // Collect all data from localStorage
    const data: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          data[key] = JSON.parse(localStorage.getItem(key) || 'null');
        } catch (e) {
          data[key] = localStorage.getItem(key);
        }
      }
    }
    
    // Convert to JSON and create a downloadable data URL
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const dataUrl = URL.createObjectURL(blob);
    
    setExportData(dataUrl);
    setIsProcessing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0]);
    }
  };

  const handleImportData = () => {
    if (!importFile) {
      toast.error('Please select a file to import');
      return;
    }
    
    setIsProcessing(true);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        
        // Clear existing data first
        localStorage.clear();
        
        // Import all key-value pairs
        Object.entries(data).forEach(([key, value]) => {
          if (typeof value === 'object') {
            localStorage.setItem(key, JSON.stringify(value));
          } else {
            localStorage.setItem(key, String(value));
          }
        });
        
        setIsImportDialogOpen(false);
        setIsProcessing(false);
        toast.success('Data imported successfully');
        
        // Reset file input
        setImportFile(null);
      } catch (error) {
        toast.error('Failed to import data: Invalid format');
        setIsProcessing(false);
      }
    };
    
    reader.onerror = () => {
      toast.error('Failed to read file');
      setIsProcessing(false);
    };
    
    reader.readAsText(importFile);
  };

  const handleRestoreBackup = async () => {
    setIsProcessing(true);
    try {
      const success = await localBackup.restore();
      if (success) {
        toast.success('Data restored successfully from backup');
      } else {
        toast.error('Failed to restore data from backup');
      }
    } catch (error) {
      console.error('Error restoring from backup:', error);
      toast.error('An error occurred during restoration');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Privacy & Data
        </CardTitle>
        <CardDescription>
          Manage your data privacy settings and export or delete your data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Toggle settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="data-collection" className="font-medium">Data Collection</Label>
              <p className="text-sm text-muted-foreground">Allow app to collect usage data to improve features</p>
            </div>
            <Switch
              id="data-collection"
              checked={isDataCollectionEnabled}
              onCheckedChange={handleDataCollectionToggle}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="analytics" className="font-medium">Analytics</Label>
              <p className="text-sm text-muted-foreground">Enable analytics for personalized insights</p>
            </div>
            <Switch
              id="analytics"
              checked={isAnalyticsEnabled}
              onCheckedChange={handleAnalyticsToggle}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
          {/* Export data button */}
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setIsExportDialogOpen(true)}
          >
            <Download className="h-4 w-4" />
            Export Data
          </Button>
          
          {/* Import data button */}
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setIsImportDialogOpen(true)}
          >
            <Upload className="h-4 w-4" />
            Import Data
          </Button>
          
          {/* Restore from backup button */}
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleRestoreBackup}
            disabled={isProcessing}
          >
            <Download className="h-4 w-4" />
            Restore Backup
          </Button>
          
          {/* Erase data button */}
          <Button
            variant="destructive"
            className="flex items-center gap-2 col-span-full mt-4"
            onClick={() => setIsEraseDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Erase All Data
          </Button>
        </div>
      </CardContent>
      
      {/* Erase data confirmation dialog */}
      <Dialog open={isEraseDialogOpen} onOpenChange={setIsEraseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Erase All Data</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All your bookmarks, notes, tasks, and settings will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEraseDialogOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleEraseAllData} disabled={isProcessing}>
              {isProcessing ? 'Erasing...' : 'Erase All Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Export data dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Your Data</DialogTitle>
            <DialogDescription>
              Download all your data in JSON format for backup or transfer to another device.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isProcessing ? (
              <p className="text-center">Preparing your data for export...</p>
            ) : exportData ? (
              <div className="flex justify-center">
                <a
                  href={exportData}
                  download="my-app-data.json"
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Data
                </a>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsExportDialogOpen(false);
              setExportData(null);
            }}>
              Close
            </Button>
            {!exportData && !isProcessing && (
              <Button onClick={handleExportData}>
                Prepare Download
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Import data dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Data</DialogTitle>
            <DialogDescription>
              Import previously exported data. This will replace all current data.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="w-full"
              disabled={isProcessing}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsImportDialogOpen(false);
              setImportFile(null);
            }} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleImportData} disabled={!importFile || isProcessing}>
              {isProcessing ? 'Importing...' : 'Import Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PrivacySettings;
