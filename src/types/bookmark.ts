
export interface ChromeBookmark {
  id: string;
  parentId?: string;
  index?: number;
  url?: string;
  title: string;
  dateAdded?: number;
  dateGroupModified?: number;
  tags?: string[];
  category?: string;
  content?: string;
  starred?: boolean;
  lastVisited?: number;
  visitCount?: number;
  children?: ChromeBookmark[];
  // Properties for sync and offline support
  metadata?: {
    tags?: string[];
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
    syncStatus?: 'synced' | 'pending' | 'conflict';
    lastSyncedAt?: string;
    deviceId?: string;
    color?: string; // Theme color for the bookmark
    icon?: string; // Custom icon for bookmark
    isImportant?: boolean; // Flag for important bookmarks
    [key: string]: any;
  };
  preview?: {
    description?: string;
    ogImage?: string;
    favicon?: string; // Favicon URL
    themeColor?: string; // Website theme color
  };
  version?: number;
  // Conflict resolution properties
  conflictVersion?: {
    local?: number;
    remote?: number;
    resolved?: boolean;
  };
  // Offline tracking
  offlineChanges?: boolean;
  // UI enhancements
  uiState?: {
    expanded?: boolean;
    highlighted?: boolean;
    recentlyAdded?: boolean;
    animationState?: 'default' | 'adding' | 'removing' | 'updating';
  };
}
