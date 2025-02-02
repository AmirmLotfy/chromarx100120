export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  aiSummary?: string;
  isArchived: boolean;
  version: number;
  versions?: {
    content: string;
    timestamp: string;
    version: number;
  }[];
}

export type NoteCategory = 'work' | 'personal' | 'study' | 'ideas' | 'other';