import { localStorageClient as supabase } from '@/lib/local-storage-client';
import { Note, NoteSentiment } from "@/types/note";
import { v4 as uuidv4 } from 'uuid';

export const getNotes = async (): Promise<Note[]> => {
  try {
    const result = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', 'current-user') // In a real app, get from auth
      .order('created_at', { ascending: false })
      .execute();

    const { data, error } = result;

    if (error) {
      throw error;
    }

    return data.map(note => ({
      id: note.id,
      title: note.title,
      content: note.content,
      createdAt: note.created_at,
      updatedAt: note.updated_at,
      userId: note.user_id,
      tags: note.tags || [],
      color: note.color,
      pinned: note.pinned,
      folder: note.folder_id,
      bookmarkIds: note.bookmark_ids,
      category: note.category,
      sentiment: note.sentiment
    }));
  } catch (error) {
    console.error('Error fetching notes:', error);
    return [];
  }
};

export const getNote = async (id: string): Promise<Note | null> => {
  try {
    const result = await supabase
      .from('notes')
      .select('*')
      .eq('id', id)
      .eq('user_id', 'current-user') // In a real app, get from auth
      .execute();

    const { data, error } = result;

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      const note = data[0];
      return {
        id: note.id,
        title: note.title,
        content: note.content,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
        userId: note.user_id,
        tags: note.tags || [],
        color: note.color,
        pinned: note.pinned,
        folder: note.folder_id,
        bookmarkIds: note.bookmark_ids,
        category: note.category,
        sentiment: note.sentiment
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching note:', error);
    return null;
  }
};

export const createNote = async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<Note | null> => {
  try {
    const newNoteId = uuidv4();
    const now = new Date().toISOString();

    const result = await supabase
      .from('notes')
      .insert({
        id: newNoteId,
        title: noteData.title,
        content: noteData.content,
        user_id: 'current-user', // In a real app, get from auth
        created_at: now,
        updated_at: now,
        color: noteData.color || '#fef08a',
        pinned: noteData.pinned || false,
        folder_id: noteData.folder || null,
        bookmark_ids: noteData.bookmarkIds || [],
        tags: noteData.tags || [],
        category: noteData.category || 'General',
        sentiment: noteData.sentiment || 'neutral'
      })
      .select()
      .execute();

    const { data, error } = result;

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      const newNote = data[0];
      return {
        id: newNote.id,
        title: newNote.title,
        content: newNote.content,
        createdAt: newNote.created_at,
        updatedAt: newNote.updated_at,
        userId: newNote.user_id,
        tags: newNote.tags || [],
        color: newNote.color,
        pinned: newNote.pinned,
        folder: newNote.folder_id,
        bookmarkIds: newNote.bookmark_ids,
        category: newNote.category,
        sentiment: newNote.sentiment
      };
    }

    return null;
  } catch (error) {
    console.error('Error creating note:', error);
    return null;
  }
};

export const updateNote = async (id: string, noteData: Partial<Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'userId'>>): Promise<Note | null> => {
  try {
    const now = new Date().toISOString();

    const result = await supabase
      .from('notes')
      .update({
        title: noteData.title,
        content: noteData.content,
        color: noteData.color,
        pinned: noteData.pinned,
        folder_id: noteData.folder,
        bookmark_ids: noteData.bookmarkIds,
        updated_at: now,
        tags: noteData.tags,
        category: noteData.category,
        sentiment: noteData.sentiment
      })
      .eq('id', id)
      .eq('user_id', 'current-user') // In a real app, get from auth
      .select()
      .execute();

    const { data, error } = result;

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      const updatedNote = data[0];
      return {
        id: updatedNote.id,
        title: updatedNote.title,
        content: updatedNote.content,
        createdAt: updatedNote.created_at,
        updatedAt: updatedNote.updated_at,
        userId: updatedNote.user_id,
        tags: updatedNote.tags || [],
        color: updatedNote.color,
        pinned: updatedNote.pinned,
        folder: updatedNote.folder_id,
        bookmarkIds: updatedNote.bookmark_ids,
        category: updatedNote.category,
        sentiment: updatedNote.sentiment
      };
    }

    return null;
  } catch (error) {
    console.error('Error updating note:', error);
    return null;
  }
};

export const deleteNote = async (id: string): Promise<boolean> => {
  try {
    const result = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', 'current-user') // In a real app, get from auth
      .execute();

    const { error } = result;

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting note:', error);
    return false;
  }
};

export const searchNotes = async (query: string): Promise<Note[]> => {
  try {
    const result = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', 'current-user') // In a real app, get from auth
      .execute();
    
    // Filter locally instead of using .single()
    const { data, error } = result;
    
    if (error) {
      throw error;
    }
    
    // Filter based on query
    const filteredNotes = data.filter(note => 
      note.title.toLowerCase().includes(query.toLowerCase()) ||
      note.content.toLowerCase().includes(query.toLowerCase())
    );
    
    // Map to the correct format
    return filteredNotes.map(note => ({
      id: note.id,
      title: note.title,
      content: note.content,
      createdAt: note.created_at,
      updatedAt: note.updated_at,
      userId: note.user_id,
      tags: note.tags || [],
      color: note.color,
      pinned: note.pinned,
      folder: note.folder_id,
      bookmarkIds: note.bookmark_ids,
      category: note.category,
      sentiment: note.sentiment
    }));
  } catch (error) {
    console.error('Error searching notes:', error);
    return [];
  }
};

export const analyzeNoteSentiment = async (noteId: string): Promise<NoteSentiment> => {
  try {
    // Placeholder logic - replace with actual sentiment analysis
    return 'neutral';
  } catch (error) {
    console.error('Error analyzing note sentiment:', error);
    return 'neutral';
  }
};

export const categorizeNote = async (noteId: string): Promise<string> => {
  try {
    // Placeholder logic - replace with actual categorization
    return 'General';
  } catch (error) {
    console.error('Error categorizing note:', error);
    return 'General';
  }
};
