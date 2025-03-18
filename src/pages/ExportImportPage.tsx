import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { localBackup } from "@/services/localBackupService";

const ExportImportPage: React.FC = () => {
  const [isBackupRunning, setIsBackupRunning] = useState(false);
  const [isRestoreRunning, setIsRestoreRunning] = useState(false);

  const handleBackup = useCallback(async () => {
    setIsBackupRunning(true);
    try {
      const success = await localBackup.syncAll();
      if (success) {
        toast.success('Backup completed successfully!');
      } else {
        toast.error('Backup failed.');
      }
    } finally {
      setIsBackupRunning(false);
    }
  }, []);

  const handleRestore = useCallback(async () => {
    setIsRestoreRunning(true);
    try {
      const success = await localBackup.restore();
      if (success) {
        toast.success('Restore completed successfully!');
      } else {
        toast.error('Restore failed.');
      }
    } finally {
      setIsRestoreRunning(false);
    }
  }, []);

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Backup & Restore</CardTitle>
          <CardDescription>
            Backup your data to Chrome Storage or restore from a previous backup.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Button onClick={handleBackup} disabled={isBackupRunning}>
            {isBackupRunning ? 'Backing up...' : 'Create Backup'}
          </Button>
          <Button onClick={handleRestore} disabled={isRestoreRunning}>
            {isRestoreRunning ? 'Restoring...' : 'Restore Backup'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportImportPage;
