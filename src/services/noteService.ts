
import { v4 as uuidv4 } from 'uuid';
import { localStorageClient as supabase } from '@/lib/local-storage-client';
import { toast } from 'sonner';

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  userId: string;
  tags?: string[];
  color?: string;
  pinned?: boolean;
  folder?: string;
  bookmarkIds?: string[];
}

export const NoteService = {
  async getAllNotes(): Promise<Note[]> {
    try {
      const user = await supabase.auth.getUser();
      const result = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.data.user?.id)
        .order('updated_at', { ascending: false })
        .execute();
      
      if (result.error) throw result.error;
      
      return result.data.map(note => ({
        id: note.id,
        title: note.title,
        content: note.content,
        createdAt: new Date(note.created_at).getTime(),
        updatedAt: new Date(note.updated_at).getTime(),
        userId: note.user_id,
        tags: note.tags,
        color: note.color,
        pinned: note.pinned,
        folder: note.folder_id,
        bookmarkIds: note.bookmark_ids
      }));
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Failed to load notes');
      return [];
    }
  },
  
  async getNote(id: string): Promise<Note | null> {
    try {
      const result = await supabase
        .from('notes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (result.error) throw result.error;
      
      const note = result.data;
      return {
        id: note.id,
        title: note.title,
        content: note.content,
        createdAt: new Date(note.created_at).getTime(),
        updatedAt: new Date(note.updated_at).getTime(),
        userId: note.user_id,
        tags: note.tags,
        color: note.color,
        pinned: note.pinned,
        folder: note.folder_id,
        bookmarkIds: note.bookmark_ids
      };
    } catch (error) {
      console.error('Error fetching note:', error);
      toast.error('Failed to load note');
      return null;
    }
  },
  
  async createNote(noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note | null> {
    try {
      const now = new Date().toISOString();
      const user = await supabase.auth.getUser();
      
      const result = await supabase
        .from('notes')
        .insert({
          id: uuidv4(),
          title: noteData.title,
          content: noteData.content,
          user_id: user.data.user?.id,
          created_at: now,
          updated_at: now,
          tags: noteData.tags || [],
          color: noteData.color,
          pinned: noteData.pinned || false,
          folder_id: noteData.folder,
          bookmark_ids: noteData.bookmarkIds
        })
        .select()
        .single();
      
      if (result.error) throw result.error;
      
      const note = result.data;
      return {
        id: note.id,
        title: note.title,
        content: note.content,
        createdAt: new Date(note.created_at).getTime(),
        updatedAt: new Date(note.updated_at).getTime(),
        userId: note.user_id,
        tags: note.tags,
        color: note.color,
        pinned: note.pinned,
        folder: note.folder_id,
        bookmarkIds: note.bookmark_ids
      };
    } catch (error) {
      console.error('Error creating note:', error);
      toast.error('Failed to create note');
      return null;
    }
  },
  
  async updateNote(id: string, noteData: Partial<Omit<Note, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Note | null> {
    try {
      const result = await supabase
        .from('notes')
        .update({
          ...noteData,
          updated_at: new Date().toISOString(),
          folder_id: noteData.folder,
          bookmark_ids: noteData.bookmarkIds
        })
        .eq('id', id)
        .select()
        .single();
      
      if (result.error) throw result.error;
      
      const note = result.data;
      return {
        id: note.id,
        title: note.title,
        content: note.content,
        createdAt: new Date(note.created_at).getTime(),
        updatedAt: new Date(note.updated_at).getTime(),
        userId: note.user_id,
        tags: note.tags,
        color: note.color,
        pinned: note.pinned,
        folder: note.folder_id,
        bookmarkIds: note.bookmark_ids
      };
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Failed to update note');
      return null;
    }
  },
  
  async deleteNote(id: string): Promise<boolean> {
    try {
      const result = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .execute();
      
      if (result.error) throw result.error;
      
      return true;
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
      return false;
    }
  },
  
  async getFolders(): Promise<any[]> {
    try {
      const user = await supabase.auth.getUser();
      const result = await supabase
        .from('note_folders')
        .select('*')
        .eq('user_id', user.data.user?.id)
        .execute();
      
      if (result.error) throw result.error;
      
      return result.data;
    } catch (error) {
      console.error('Error fetching folders:', error);
      toast.error('Failed to load folders');
      return [];
    }
  },
  
  async createFolder(name: string, color?: string, icon?: string): Promise<any | null> {
    try {
      const user = await supabase.auth.getUser();
      const result = await supabase
        .from('note_folders')
        .insert({
          id: uuidv4(),
          name,
          color,
          icon,
          user_id: user.data.user?.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (result.error) throw result.error;
      
      return result.data;
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Failed to create folder');
      return null;
    }
  }
};

export default NoteService;
