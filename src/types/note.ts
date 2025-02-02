export type NoteSentiment = 'positive' | 'negative' | 'neutral';

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  createdAt: string;
  updatedAt: string;
  sentiment?: NoteSentiment;
  summary?: string;
  taskId?: string;
  bookmarkIds?: string[];
}