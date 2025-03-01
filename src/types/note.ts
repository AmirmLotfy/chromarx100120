
export type NoteSentiment = 'positive' | 'negative' | 'neutral' | undefined;

export interface SentimentDetails {
  score: number;
  confidence: number;
  dominantEmotion?: string;
  language: string;
  [key: string]: any; // Add index signature for Json compatibility
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  createdAt: string;
  updatedAt: string;
  version?: number;
  sentiment?: NoteSentiment;
  sentimentDetails?: SentimentDetails;
  summary?: string;
  taskId?: string;
  bookmarkIds?: string[];
  folderId?: string;
  pinned?: boolean;
  color?: string;
  _hasConflict?: boolean;
  _remoteVersion?: number;
}

export interface NoteFolder {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export type NoteSortOption = 'updatedAt' | 'createdAt' | 'title' | 'category';
export type NoteSortDirection = 'asc' | 'desc';

export interface NoteSort {
  field: NoteSortOption;
  direction: NoteSortDirection;
}

export interface NoteFilter {
  category?: string;
  tags?: string[];
  folder?: string;
  searchText?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}
