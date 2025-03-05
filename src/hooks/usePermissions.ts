
import { useState, useEffect, useCallback } from 'react';
import { 
  hasPermissions, 
  requestPermissions, 
  removePermissions, 
  getAllPermissions,
  PermissionRequest 
} from '@/utils/permissionUtils';
import { toast } from 'sonner';

export const usePermissions = (initialRequest?: PermissionRequest) => {
  const [isGranted, setIsGranted] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [permissionState, setPermissionState] = useState<chrome.permissions.Permissions>({ 
    permissions: [], 
    origins: [] 
  });

  // Check if permission is granted
  const checkPermission = useCallback(async (request?: PermissionRequest) => {
    setIsChecking(true);
    try {
      const permissionRequest = request || initialRequest;
      if (!permissionRequest) {
        const allPermissions = await getAllPermissions();
        setPermissionState(allPermissions);
        setIsGranted(true); // No specific permissions requested, so consider it granted
        return true;
      }
      
      const granted = await hasPermissions(permissionRequest);
      setIsGranted(granted);
      return granted;
    } catch (error) {
      console.error('Error checking permissions:', error);
      setIsGranted(false);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [initialRequest]);

  // Request permission
  const requestPermission = useCallback(async (request?: PermissionRequest) => {
    const permissionRequest = request || initialRequest;
    if (!permissionRequest) {
      toast.error('No permissions specified to request');
      return false;
    }
    
    try {
      const granted = await requestPermissions(permissionRequest);
      setIsGranted(granted);
      
      // Update the full permission state if granted
      if (granted) {
        checkPermission();
      }
      
      return granted;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      toast.error('Failed to request permissions');
      return false;
    }
  }, [initialRequest, checkPermission]);

  // Remove permission
  const revokePermission = useCallback(async (request?: PermissionRequest) => {
    const permissionRequest = request || initialRequest;
    if (!permissionRequest) {
      toast.error('No permissions specified to revoke');
      return false;
    }
    
    try {
      const removed = await removePermissions(permissionRequest);
      if (removed) {
        setIsGranted(false);
        checkPermission();
      }
      return removed;
    } catch (error) {
      console.error('Error revoking permissions:', error);
      toast.error('Failed to revoke permissions');
      return false;
    }
  }, [initialRequest, checkPermission]);

  // Refresh all permissions
  const refreshPermissions = useCallback(async () => {
    const allPermissions = await getAllPermissions();
    setPermissionState(allPermissions);
    
    if (initialRequest) {
      await checkPermission(initialRequest);
    }
  }, [initialRequest, checkPermission]);

  // Check permissions on mount
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  return {
    isGranted,
    isChecking,
    permissionState,
    checkPermission,
    requestPermission,
    revokePermission,
    refreshPermissions
  };
};

export default usePermissions;
