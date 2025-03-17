
import { ChromeBookmark } from "@/types/bookmark";
import { toast } from "sonner";

// Simplified versions of the types without Supabase dependencies
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
  status: 'active' | 'archived' | 'deleted';
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

// Local storage-based implementations
export const saveBookmarkMetadata = async (bookmark: ChromeBookmark, userId: string): Promise<BookmarkMetadata> => {
  try {
    const metadata: BookmarkMetadata = {
      id: `meta_${bookmark.id}`,
      user_id: userId,
      bookmark_id: bookmark.id,
      url: bookmark.url || '',
      title: bookmark.title,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Save to local storage
    const metadataList = JSON.parse(localStorage.getItem('bookmarkMetadata') || '[]');
    const existingIndex = metadataList.findIndex((item: BookmarkMetadata) => item.bookmark_id === bookmark.id);
    
    if (existingIndex >= 0) {
      metadataList[existingIndex] = metadata;
    } else {
      metadataList.push(metadata);
    }
    
    localStorage.setItem('bookmarkMetadata', JSON.stringify(metadataList));
    return metadata;
  } catch (error) {
    console.error('Error saving bookmark metadata:', error);
    toast.error('Failed to save bookmark metadata');
    throw error;
  }
};

export const getBookmarkMetadata = async (bookmarkId: string, userId: string): Promise<BookmarkMetadata | null> => {
  try {
    const metadataList = JSON.parse(localStorage.getItem('bookmarkMetadata') || '[]');
    const metadata = metadataList.find(
      (item: BookmarkMetadata) => item.bookmark_id === bookmarkId && item.user_id === userId
    );
    return metadata || null;
  } catch (error) {
    console.error('Error fetching bookmark metadata:', error);
    toast.error('Failed to fetch bookmark metadata');
    throw error;
  }
};

export const createCollection = async (
  collection: Pick<BookmarkCollection, 'name'> & Partial<Omit<BookmarkCollection, 'id' | 'user_id'>>,
  userId: string
): Promise<BookmarkCollection> => {
  try {
    const newCollection: BookmarkCollection = {
      id: `col_${Date.now()}`,
      user_id: userId,
      name: collection.name,
      description: collection.description,
      icon: collection.icon,
      color: collection.color,
      is_public: collection.is_public || false,
      parent_id: collection.parent_id,
      order: collection.order,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const collections = JSON.parse(localStorage.getItem('bookmarkCollections') || '[]');
    collections.push(newCollection);
    localStorage.setItem('bookmarkCollections', JSON.stringify(collections));
    
    return newCollection;
  } catch (error) {
    console.error('Error creating collection:', error);
    toast.error('Failed to create collection');
    throw error;
  }
};

export const addBookmarkToCollection = async (
  collectionId: string,
  bookmarkId: string,
  position?: number
): Promise<void> => {
  try {
    const collectionItems = JSON.parse(localStorage.getItem('bookmarkCollectionItems') || '[]');
    collectionItems.push({
      id: `item_${Date.now()}`,
      collection_id: collectionId,
      bookmark_id: bookmarkId,
      position: position || collectionItems.length,
      created_at: new Date().toISOString()
    });
    
    localStorage.setItem('bookmarkCollectionItems', JSON.stringify(collectionItems));
  } catch (error) {
    console.error('Error adding bookmark to collection:', error);
    toast.error('Failed to add bookmark to collection');
    throw error;
  }
};

// Simplified implementation for the remaining functions
export const updateBookmarkHealth = async (bookmarkId: string, userId: string, health: any): Promise<void> => {
  console.log('Updating bookmark health (local implementation):', bookmarkId, health);
};

export const updateBookmarkAnalytics = async (bookmarkId: string, userId: string, analytics: any): Promise<void> => {
  console.log('Updating bookmark analytics (local implementation):', bookmarkId, analytics);
};
