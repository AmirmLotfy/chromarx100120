import { localStorageClient } from '@/lib/chrome-storage-client';
import { Note, NoteSentiment } from "@/types/note";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";

// Define an interface that represents the database note structure
interface DbNote {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  tags: string[];
  color?: string;
  pinned?: boolean;
  folder_id?: string;
  bookmark_ids?: string[];
  category?: string;
  sentiment?: NoteSentiment;
}

// Helper function to safely map database note to client note model
const mapNoteFromDb = (note: any): Note => {
  if (!note) return {} as Note;
  
  return {
    id: typeof note.id === 'string' ? note.id : '',
    title: typeof note.title === 'string' ? note.title : '',
    content: typeof note.content === 'string' ? note.content : '',
    createdAt: typeof note.created_at === 'string' ? note.created_at : '',
    updatedAt: typeof note.updated_at === 'string' ? note.updated_at : '',
    userId: typeof note.user_id === 'string' ? note.user_id : '',
    tags: Array.isArray(note.tags) ? note.tags : [],
    color: typeof note.color === 'string' ? note.color : undefined,
    pinned: typeof note.pinned === 'boolean' ? note.pinned : false,
    folder: typeof note.folder_id === 'string' ? note.folder_id : undefined,
    bookmarkIds: Array.isArray(note.bookmark_ids) ? note.bookmark_ids : [],
    category: typeof note.category === 'string' ? note.category : 'General',
    sentiment: note.sentiment as NoteSentiment || 'neutral'
  };
};

export const getNotes = async (): Promise<Note[]> => {
  try {
    const result = await localStorageClient
      .from('notes')
      .select()
      .eq('user_id', 'current-user')
      .order('created_at', { ascending: false })
      .execute();

    if (result.error) {
      throw result.error;
    }

    return (result.data || []).map(note => mapNoteFromDb(note));
  } catch (error) {
    console.error('Error fetching notes:', error);
    toast.error('Failed to fetch notes');
    return [];
  }
};

export const getNote = async (id: string): Promise<Note | null> => {
  try {
    const result = await localStorageClient
      .from('notes')
      .select()
      .eq('id', id)
      .eq('user_id', 'current-user')
      .execute();

    if (result.error) {
      throw result.error;
    }

    if (result.data && result.data.length > 0) {
      return mapNoteFromDb(result.data[0]);
    }

    return null;
  } catch (error) {
    console.error('Error fetching note:', error);
    toast.error('Failed to fetch note');
    return null;
  }
};

export const createNote = async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<Note | null> => {
  try {
    const newNoteId = uuidv4();
    const now = new Date().toISOString();

    const dbNote: DbNote = {
      id: newNoteId,
      title: noteData.title,
      content: noteData.content,
      user_id: 'current-user',
      created_at: now,
      updated_at: now,
      color: noteData.color || '#fef08a',
      pinned: noteData.pinned || false,
      folder_id: noteData.folder || null,
      bookmark_ids: noteData.bookmarkIds || [],
      tags: noteData.tags || [],
      category: noteData.category || 'General',
      sentiment: noteData.sentiment || 'neutral'
    };

    const result = await localStorageClient
      .from('notes')
      .insert(dbNote)
      .execute();

    if (result.error) {
      throw result.error;
    }

    if (result.data && Array.isArray(result.data) && result.data.length > 0) {
      toast.success('Note created successfully');
      return mapNoteFromDb(result.data[0]);
    }

    return null;
  } catch (error) {
    console.error('Error creating note:', error);
    toast.error('Failed to create note');
    return null;
  }
};

export const updateNote = async (id: string, noteData: Partial<Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'userId'>>): Promise<Note | null> => {
  try {
    const now = new Date().toISOString();
    const updateData: any = {
      ...noteData,
      updated_at: now
    };
    
    // Convert client-side fields to database fields
    if (noteData.folder !== undefined) {
      updateData.folder_id = noteData.folder;
      delete updateData.folder;
    }
    
    if (noteData.bookmarkIds !== undefined) {
      updateData.bookmark_ids = noteData.bookmarkIds;
      delete updateData.bookmarkIds;
    }

    const result = await localStorageClient
      .from('notes')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', 'current-user')
      .execute();

    if (result.error) {
      throw result.error;
    }

    if (result.data && result.data.length > 0) {
      toast.success('Note updated successfully');
      return mapNoteFromDb(result.data[0]);
    }

    return null;
  } catch (error) {
    console.error('Error updating note:', error);
    toast.error('Failed to update note');
    return null;
  }
};

export const deleteNote = async (id: string): Promise<boolean> => {
  try {
    const result = await localStorageClient
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', 'current-user')
      .execute();

    if (result.error) {
      throw result.error;
    }

    toast.success('Note deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting note:', error);
    toast.error('Failed to delete note');
    return false;
  }
};

export const searchNotes = async (query: string): Promise<Note[]> => {
  try {
    const result = await localStorageClient
      .from('notes')
      .select()
      .eq('user_id', 'current-user')
      .execute();
    
    if (result.error) {
      throw result.error;
    }
    
    const filteredNotes = (result.data || []).filter(note => {
      const noteObj = note as any;
      const title = typeof noteObj.title === 'string' ? noteObj.title : '';
      const content = typeof noteObj.content === 'string' ? noteObj.content : '';
      
      return title.toLowerCase().includes(query.toLowerCase()) ||
             content.toLowerCase().includes(query.toLowerCase());
    });
    
    return filteredNotes.map(note => mapNoteFromDb(note));
  } catch (error) {
    console.error('Error searching notes:', error);
    toast.error('Failed to search notes');
    return [];
  }
};

export const analyzeNoteSentiment = async (noteId: string): Promise<NoteSentiment> => {
  try {
    // Just returning 'neutral' since we no longer have access to Supabase functions
    // In a real app, you'd implement sentiment analysis in the client
    return 'neutral';
  } catch (error) {
    console.error('Error analyzing note sentiment:', error);
    return 'neutral';
  }
};

export const categorizeNote = async (noteId: string): Promise<string> => {
  try {
    // Just returning 'General' since we no longer have access to Supabase functions
    // In a real app, you'd implement categorization in the client
    return 'General';
  } catch (error) {
    console.error('Error categorizing note:', error);
    return 'General';
  }
};
