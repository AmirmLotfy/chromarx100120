
import { localStorageClient } from '@/lib/chrome-storage-client';
import { Note, NoteSentiment } from "@/types/note";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";

export const getNotes = async (): Promise<Note[]> => {
  try {
    const result = await localStorageClient
      .from('notes')
      .select('*')
      .eq('user_id', 'current-user')
      .order('created_at', { ascending: false })
      .execute();

    if (result.error) {
      throw result.error;
    }

    return (result.data || []).map(note => ({
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
    toast.error('Failed to fetch notes');
    return [];
  }
};

export const getNote = async (id: string): Promise<Note | null> => {
  try {
    const result = await localStorageClient
      .from('notes')
      .select('*')
      .eq('id', id)
      .eq('user_id', 'current-user')
      .execute();

    if (result.error) {
      throw result.error;
    }

    if (result.data && result.data.length > 0) {
      const note = result.data[0];
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
    toast.error('Failed to fetch note');
    return null;
  }
};

export const createNote = async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<Note | null> => {
  try {
    const newNoteId = uuidv4();
    const now = new Date().toISOString();

    const result = await localStorageClient
      .from('notes')
      .insert({
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
      })
      .select()
      .execute();

    if (result.error) {
      throw result.error;
    }

    if (result.data && result.data.length > 0) {
      const newNote = result.data[0];
      toast.success('Note created successfully');
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
    toast.error('Failed to create note');
    return null;
  }
};

export const updateNote = async (id: string, noteData: Partial<Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'userId'>>): Promise<Note | null> => {
  try {
    const now = new Date().toISOString();
    const updateData = {
      ...noteData,
      updated_at: now
    };

    const result = await localStorageClient
      .from('notes')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', 'current-user')
      .select()
      .execute();

    if (result.error) {
      throw result.error;
    }

    if (result.data && result.data.length > 0) {
      const updatedNote = result.data[0];
      toast.success('Note updated successfully');
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
      .select('*')
      .eq('user_id', 'current-user')
      .execute();
    
    if (result.error) {
      throw result.error;
    }
    
    const filteredNotes = (result.data || []).filter(note => 
      note.title.toLowerCase().includes(query.toLowerCase()) ||
      note.content.toLowerCase().includes(query.toLowerCase())
    );
    
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
