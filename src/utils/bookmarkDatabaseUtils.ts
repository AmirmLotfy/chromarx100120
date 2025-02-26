
import { supabase } from "@/integrations/supabase/client";
import { BookmarkMetadata, BookmarkCollection, BookmarkHealth, BookmarkAnalytics } from "@/types/bookmark-metadata";
import { ChromeBookmark } from "@/types/bookmark";
import { toast } from "sonner";

export const saveBookmarkMetadata = async (bookmark: ChromeBookmark, userId: string): Promise<BookmarkMetadata> => {
  const metadata: Partial<BookmarkMetadata> = {
    user_id: userId,
    bookmark_id: bookmark.id,
    url: bookmark.url || '',
    title: bookmark.title,
    status: 'active',
  };

  const { data, error } = await supabase
    .from('bookmark_metadata')
    .upsert(metadata)
    .select()
    .single();

  if (error) {
    console.error('Error saving bookmark metadata:', error);
    toast.error('Failed to save bookmark metadata');
    throw error;
  }

  return data;
};

export const getBookmarkMetadata = async (bookmarkId: string, userId: string): Promise<BookmarkMetadata | null> => {
  const { data, error } = await supabase
    .from('bookmark_metadata')
    .select('*')
    .eq('bookmark_id', bookmarkId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching bookmark metadata:', error);
    toast.error('Failed to fetch bookmark metadata');
    throw error;
  }

  return data;
};

export const createCollection = async (
  collection: Partial<BookmarkCollection>,
  userId: string
): Promise<BookmarkCollection> => {
  const { data, error } = await supabase
    .from('bookmark_collections')
    .insert({ ...collection, user_id: userId })
    .select()
    .single();

  if (error) {
    console.error('Error creating collection:', error);
    toast.error('Failed to create collection');
    throw error;
  }

  return data;
};

export const addBookmarkToCollection = async (
  collectionId: string,
  bookmarkId: string,
  position?: number
): Promise<void> => {
  const { error } = await supabase
    .from('bookmark_collection_items')
    .insert({
      collection_id: collectionId,
      bookmark_id: bookmarkId,
      position
    });

  if (error) {
    console.error('Error adding bookmark to collection:', error);
    toast.error('Failed to add bookmark to collection');
    throw error;
  }
};

export const updateBookmarkHealth = async (
  bookmarkId: string,
  userId: string,
  health: Partial<BookmarkHealth>
): Promise<void> => {
  const { error } = await supabase
    .from('bookmark_health')
    .upsert({
      bookmark_id: bookmarkId,
      user_id: userId,
      ...health
    });

  if (error) {
    console.error('Error updating bookmark health:', error);
    toast.error('Failed to update bookmark health');
    throw error;
  }
};

export const updateBookmarkAnalytics = async (
  bookmarkId: string,
  userId: string,
  analytics: Partial<BookmarkAnalytics>
): Promise<void> => {
  const { error } = await supabase
    .from('bookmark_analytics')
    .upsert({
      bookmark_id: bookmarkId,
      user_id: userId,
      ...analytics
    });

  if (error) {
    console.error('Error updating bookmark analytics:', error);
    toast.error('Failed to update bookmark analytics');
    throw error;
  }
};
