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
}
