
import { Database } from "@/integrations/supabase/types";

type bookmark_status = Database["public"]["Enums"]["bookmark_status"];

export interface BookmarkMetadata {
  id: string;
  user_id: string;
  bookmark_id: string;
  url: string;
  title: string;
  category?: string;
  tags?: string[];
  summary?: string;
  sentiment?: string;
  content?: string;
  reading_time?: number;
  importance_score?: number;
  last_visited?: string;
  status: bookmark_status;
  created_at?: string;
  updated_at?: string;
}

export interface BookmarkCollection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  is_public: boolean;
  parent_id?: string;
  order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface BookmarkHealth {
  id: string;
  bookmark_id: string;
  user_id: string;
  last_checked: string;
  is_accessible: boolean;
  response_time?: number;
  error_message?: string;
}

export interface BookmarkAnalytics {
  id: string;
  user_id: string;
  bookmark_id: string;
  visit_count: number;
  last_visited?: string;
  avg_time_spent?: number;
}
