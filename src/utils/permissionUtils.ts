
/**
 * Utilities for managing Chrome extension permissions
 */
import { logger, createNamespacedLogger } from './loggerUtils';
import { toast } from 'sonner';

const permissionLogger = createNamespacedLogger('Permissions');

export interface PermissionRequest {
  permissions?: chrome.permissions.Permissions['permissions'];
  origins?: chrome.permissions.Permissions['origins'];
}

/**
 * Check if the extension has the specified permissions
 */
export const hasPermissions = async (request: PermissionRequest): Promise<boolean> => {
  try {
    if (typeof chrome === 'undefined' || !chrome.permissions) {
      permissionLogger.warn('Chrome permissions API not available');
      return false;
    }
    
    return await chrome.permissions.contains({
      permissions: request.permissions || [],
      origins: request.origins || []
    });
  } catch (error) {
    permissionLogger.error('Error checking permissions', error);
    return false;
  }
};

/**
 * Request additional permissions for the extension
 * Returns true if permissions were granted, false otherwise
 */
export const requestPermissions = async (request: PermissionRequest): Promise<boolean> => {
  try {
    if (typeof chrome === 'undefined' || !chrome.permissions) {
      permissionLogger.warn('Chrome permissions API not available');
      toast.error('Permission API not available in this environment');
      return false;
    }
    
    permissionLogger.info('Requesting permissions', request);
    
    const granted = await chrome.permissions.request({
      permissions: request.permissions || [],
      origins: request.origins || []
    });
    
    if (granted) {
      permissionLogger.info('Permissions granted', request);
      toast.success('Permissions granted');
    } else {
      permissionLogger.warn('Permissions denied by user', request);
      toast.error('Required permissions were not granted');
    }
    
    return granted;
  } catch (error) {
    permissionLogger.error('Error requesting permissions', error);
    toast.error('Error requesting permissions');
    return false;
  }
};

/**
 * Remove permissions from the extension
 */
export const removePermissions = async (request: PermissionRequest): Promise<boolean> => {
  try {
    if (typeof chrome === 'undefined' || !chrome.permissions) {
      permissionLogger.warn('Chrome permissions API not available');
      return false;
    }
    
    permissionLogger.info('Removing permissions', request);
    
    const removed = await chrome.permissions.remove({
      permissions: request.permissions || [],
      origins: request.origins || []
    });
    
    if (removed) {
      permissionLogger.info('Permissions removed', request);
    } else {
      permissionLogger.warn('Failed to remove permissions', request);
    }
    
    return removed;
  } catch (error) {
    permissionLogger.error('Error removing permissions', error);
    return false;
  }
};

/**
 * Get all current permissions of the extension
 */
export const getAllPermissions = async (): Promise<chrome.permissions.Permissions> => {
  try {
    if (typeof chrome === 'undefined' || !chrome.permissions) {
      permissionLogger.warn('Chrome permissions API not available');
      return { permissions: [], origins: [] };
    }
    
    return await chrome.permissions.getAll();
  } catch (error) {
    permissionLogger.error('Error getting all permissions', error);
    return { permissions: [], origins: [] };
  }
};
