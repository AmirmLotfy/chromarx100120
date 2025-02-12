
export type NoteSentiment = 'positive' | 'negative' | 'neutral';

export interface SentimentDetails {
  score: number;
  confidence: number;
  dominantEmotion?: string;
  language: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  createdAt: string;
  updatedAt: string;
  sentiment?: NoteSentiment;
  sentimentDetails?: SentimentDetails;
  summary?: string;
  taskId?: string;
  bookmarkIds?: string[];
}
