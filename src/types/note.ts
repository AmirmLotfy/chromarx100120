export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  createdAt: string;
  updatedAt: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  summary?: string;
}

export type NoteView = 'grid' | 'list';