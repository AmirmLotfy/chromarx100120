
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  color?: string;
  pinned?: boolean;
  folder?: string;
  bookmarkIds?: string[];
  tags?: string[];
  category?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export interface SentimentDetails {
  score: number;
  magnitude: number;
  mainEmotion: string;
  emotions: Record<string, number>;
}

export type ExtendedNote = Note;
