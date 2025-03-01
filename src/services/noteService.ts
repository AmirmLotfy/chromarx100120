
import { Note } from "@/types/note";
import { storage } from "./storageService";
import { supabase } from "@/integrations/supabase/client";
import { auth } from "@/lib/chrome-utils";

const NOTES_STORAGE_KEY = "notes";

export class NoteService {
  private notesChangeCallbacks: ((notes: Note[]) => void)[] = [];

  constructor(private storage = storage) {}

  async getAllNotes(): Promise<Note[]> {
    try {
      // Try to get from Supabase first if we're online
      if (navigator.onLine) {
        try {
          const user = await auth.getCurrentUser();
          if (user) {
            console.log("Fetching notes from Supabase");
            const { data, error } = await supabase
              .from('notes')
              .select('*')
              .eq('user_id', user.id)
              .order('updated_at', { ascending: false });
            
            if (error) throw error;
            
            if (data) {
              // Transform from DB format to app format
              const notes: Note[] = data.map(note => ({
                id: note.id,
                title: note.title,
                content: note.content,
                tags: note.tags || [],
                category: note.category || 'uncategorized',
                createdAt: note.created_at,
                updatedAt: note.updated_at,
                sentiment: note.sentiment as 'positive' | 'negative' | 'neutral' | undefined,
                sentimentDetails: note.sentiment_details as any,
                summary: note.summary,
                taskId: note.task_id,
                bookmarkIds: note.bookmark_ids,
                folderId: note.folder_id,
                pinned: note.pinned,
                color: note.color,
                version: note.version || 1
              }));
              
              // Store in local DB for offline access
              await this.storage.set('notes', notes);
              
              return notes;
            }
          }
        } catch (error) {
          console.error("Error fetching notes from Supabase:", error);
          // Fall back to local storage if Supabase fails
        }
      }
      
      // Fall back to local storage if offline or Supabase failed
      const notes = await this.storage.get(NOTES_STORAGE_KEY) || [];
      return notes;
    } catch (error) {
      console.error("Error getting all notes:", error);
      return [];
    }
  }

  async createNote(note: Omit<Note, "id">): Promise<Note | null> {
    try {
      // Generate an ID for the new note
      const id = crypto.randomUUID();
      
      // Create note object with version tracking
      const newNote: Note = {
        ...note,
        id,
        version: 1
      };
      
      // Save locally
      const existingNotes = await this.storage.get(NOTES_STORAGE_KEY) || [];
      const updatedNotes = [newNote, ...existingNotes];
      await this.storage.set(NOTES_STORAGE_KEY, updatedNotes);
      
      // Update cache
      this.handleNotesChange(updatedNotes);
      
      // Try to save to Supabase if online
      if (navigator.onLine) {
        try {
          const user = await auth.getCurrentUser();
          if (user) {
            // Transform to DB format
            const { data, error } = await supabase.from('notes').insert({
              id: newNote.id,
              title: newNote.title,
              content: newNote.content,
              tags: newNote.tags,
              category: newNote.category,
              created_at: newNote.createdAt,
              updated_at: newNote.updatedAt,
              user_id: user.id,
              version: 1,
              sentiment: newNote.sentiment,
              sentiment_details: newNote.sentimentDetails as any,
              folder_id: newNote.folderId,
              pinned: newNote.pinned,
              color: newNote.color
            }).select().single();
            
            if (error) throw error;
            console.log("Note created in Supabase:", data);
          }
        } catch (error) {
          console.error("Error saving note to Supabase:", error);
          // Add to offline queue for syncing later
          this.addToOfflineQueue('create', newNote);
        }
      } else {
        // Add to offline queue for syncing later
        this.addToOfflineQueue('create', newNote);
      }
      
      return newNote;
    } catch (error) {
      console.error("Error creating note:", error);
      return null;
    }
  }

  async updateNote(note: Note): Promise<Note | null> {
    try {
      // Get existing notes
      const existingNotes = await this.storage.get<Note[]>('notes') || [];
      
      // Find and update the note
      const updatedNotes = existingNotes.map(n => 
        n.id === note.id ? { ...note, updatedAt: new Date().toISOString() } : n
      );
      
      // Update local storage
      await this.storage.set('notes', updatedNotes);
      
      // Update cache
      this.handleNotesChange(updatedNotes);
      
      // Try to update in Supabase if online
      if (navigator.onLine) {
        try {
          const user = await auth.getCurrentUser();
          if (user) {
            // Transform to DB format
            const { data, error } = await supabase
              .from('notes')
              .update({
                title: note.title,
                content: note.content,
                tags: note.tags,
                category: note.category,
                updated_at: new Date().toISOString(),
                sentiment: note.sentiment,
                sentiment_details: note.sentimentDetails,
                summary: note.summary,
                task_id: note.taskId,
                bookmark_ids: note.bookmarkIds,
                folder_id: note.folderId,
                pinned: note.pinned,
                color: note.color,
                version: note.version || 1
              })
              .eq('id', note.id)
              // Only update if our version is higher or equal
              .gte('version', note.version ? note.version - 1 : 0)
              .select()
              .single();
            
            if (error) {
              // Check if it's a version conflict
              if (error.message?.includes('no rows')) {
                console.warn("Version conflict detected, will need resolution");
                
                // Get the latest version from server
                const { data: latestData } = await supabase
                  .from('notes')
                  .select('*')
                  .eq('id', note.id)
                  .single();
                
                if (latestData) {
                  console.log("Remote version:", latestData.version, "Local version:", note.version);
                  // We'll return our local version but flag the conflict
                  // The conflict resolution will happen in the component
                  return {
                    ...note,
                    _hasConflict: true,
                    _remoteVersion: latestData.version
                  } as Note;
                }
              }
              throw error;
            }
            
            console.log("Note updated in Supabase:", data);
            return note;
          }
        } catch (error) {
          console.error("Error updating note in Supabase:", error);
          // Add to offline queue for syncing later
          this.addToOfflineQueue('update', note);
        }
      } else {
        // Add to offline queue for syncing later
        this.addToOfflineQueue('update', note);
      }
      
      return note;
    } catch (error) {
      console.error("Error updating note:", error);
      return null;
    }
  }

  async deleteNote(id: string): Promise<boolean> {
    try {
      // Get existing notes
      const existingNotes = await this.storage.get<Note[]>('notes') || [];
      
      // Filter out the note to delete
      const updatedNotes = existingNotes.filter(note => note.id !== id);
      
      // Update local storage
      await this.storage.set('notes', updatedNotes);
      
      // Update cache
      this.handleNotesChange(updatedNotes);
      
      // Try to delete from Supabase if online
      if (navigator.onLine) {
        try {
          const { error } = await supabase
            .from('notes')
            .delete()
            .eq('id', id);
          
          if (error) throw error;
          console.log("Note deleted from Supabase");
        } catch (error) {
          console.error("Error deleting note from Supabase:", error);
          // Add to offline queue for syncing later
          this.addToOfflineQueue('delete', { id });
        }
      } else {
        // Add to offline queue for syncing later
        this.addToOfflineQueue('delete', { id });
      }
      
      return true;
    } catch (error) {
      console.error("Error deleting note:", error);
      return false;
    }
  }

  async syncNotesWithSupabase(): Promise<boolean> {
    if (!navigator.onLine) {
      console.log("Cannot sync notes while offline");
      return false;
    }
    
    try {
      const user = await auth.getCurrentUser();
      if (!user) {
        console.log("No user found, cannot sync notes");
        return false;
      }
      
      // Process offline queue first
      await this.processOfflineQueue();
      
      // Get local notes
      const localNotes = await this.storage.get(NOTES_STORAGE_KEY) || [];
      
      // Get server notes
      const { data: serverNotes, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      if (!serverNotes) {
        return false;
      }
      
      // Transform server notes to app format
      const transformedServerNotes: Note[] = serverNotes.map(note => ({
        id: note.id,
        title: note.title,
        content: note.content,
        tags: note.tags || [],
        category: note.category || 'uncategorized',
        createdAt: note.created_at,
        updatedAt: note.updated_at,
        sentiment: note.sentiment as 'positive' | 'negative' | 'neutral' | undefined,
        sentimentDetails: note.sentiment_details as any,
        summary: note.summary,
        taskId: note.task_id,
        bookmarkIds: note.bookmark_ids,
        folderId: note.folder_id,
        pinned: note.pinned,
        color: note.color,
        version: note.version || 1
      }));
      
      // Create maps for easier access
      const serverNotesMap = new Map(transformedServerNotes.map(note => [note.id, note]));
      const localNotesMap = new Map(localNotes.map(note => [note.id, note]));
      
      // Notes to create on server
      const notesToCreate: Note[] = [];
      
      // Notes to update locally
      const notesToUpdateLocally: Note[] = [];
      
      // Identify local notes not on server
      localNotes.forEach(localNote => {
        if (!serverNotesMap.has(localNote.id)) {
          notesToCreate.push(localNote);
        }
      });
      
      // Identify server notes to update locally
      transformedServerNotes.forEach(serverNote => {
        const localNote = localNotesMap.get(serverNote.id);
        
        if (!localNote) {
          // Server note doesn't exist locally
          notesToUpdateLocally.push(serverNote);
        } else {
          // Both exist, check versions
          const serverVersion = serverNote.version || 1;
          const localVersion = localNote.version || 1;
          
          if (serverVersion > localVersion) {
            // Server has newer version
            notesToUpdateLocally.push(serverNote);
          }
        }
      });
      
      // Create notes on server
      if (notesToCreate.length > 0) {
        const notesToInsert = notesToCreate.map(note => ({
          id: note.id,
          title: note.title,
          content: note.content,
          tags: note.tags,
          category: note.category,
          created_at: note.createdAt,
          updated_at: note.updatedAt,
          user_id: user.id,
          sentiment: note.sentiment,
          sentiment_details: note.sentimentDetails as any,
          summary: note.summary,
          task_id: note.taskId,
          bookmark_ids: note.bookmarkIds,
          folder_id: note.folderId,
          pinned: note.pinned,
          color: note.color,
          version: note.version || 1
        }));
        
        console.log(`Creating ${notesToInsert.length} notes on server`);
        
        // Since we can't insert an array directly (due to the typing issues), we'll insert them one by one
        for (const noteToInsert of notesToInsert) {
          const { error: insertError } = await supabase
            .from('notes')
            .insert(noteToInsert);
          
          if (insertError) {
            console.error("Error inserting note:", insertError);
          }
        }
      }
      
      // Update local notes
      if (notesToUpdateLocally.length > 0) {
        console.log(`Updating ${notesToUpdateLocally.length} notes locally`);
        
        // Merge with existing local notes
        const updatedNotes = localNotes.filter(note => 
          !notesToUpdateLocally.some(serverNote => serverNote.id === note.id)
        );
        
        updatedNotes.push(...notesToUpdateLocally);
        
        // Sort by updated date
        updatedNotes.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        
        // Save locally
        await this.storage.set(NOTES_STORAGE_KEY, updatedNotes);
        
        // Update cache
        this.handleNotesChange(updatedNotes);
      }
      
      console.log("Notes sync completed successfully");
      return true;
    } catch (error) {
      console.error("Error syncing notes with Supabase:", error);
      throw error;
    }
  }

  private addToOfflineQueue(operation: 'create' | 'update' | 'delete', note: any): void {
    const queue = localStorage.getItem('offlineQueue');
    let offlineQueue = queue ? JSON.parse(queue) : [];
    offlineQueue.push({ operation, note });
    localStorage.setItem('offlineQueue', JSON.stringify(offlineQueue));
  }

  private async processOfflineQueue(): Promise<void> {
    const queue = localStorage.getItem('offlineQueue');
    let offlineQueue = queue ? JSON.parse(queue) : [];

    while (offlineQueue.length > 0) {
      const { operation, note } = offlineQueue.shift();

      try {
        const user = await auth.getCurrentUser();
        if (!user) {
          console.log("No user found, cannot sync notes");
          break;
        }

        if (operation === 'create') {
          await supabase.from('notes').insert({
            id: note.id,
            title: note.title,
            content: note.content,
            tags: note.tags,
            category: note.category,
            created_at: note.createdAt,
            updated_at: note.updatedAt,
            user_id: user.id,
            version: 1
          });
        } else if (operation === 'update') {
          await supabase
            .from('notes')
            .update({
              title: note.title,
              content: note.content,
              tags: note.tags,
              category: note.category,
              updated_at: new Date().toISOString(),
              sentiment: note.sentiment,
              sentiment_details: note.sentimentDetails,
              summary: note.summary,
              task_id: note.taskId,
              bookmark_ids: note.bookmarkIds,
              folder_id: note.folderId,
              pinned: note.pinned,
              color: note.color,
              version: note.version || 1
            })
            .eq('id', note.id);
        } else if (operation === 'delete') {
          await supabase.from('notes').delete().eq('id', note.id);
        }

        localStorage.setItem('offlineQueue', JSON.stringify(offlineQueue));
      } catch (error) {
        console.error("Error processing offline queue:", error);
        break;
      }
    }
  }

  async getSyncStatus(): Promise<'online' | 'offline' | 'syncing' | 'error'> {
    if (!navigator.onLine) return 'offline';
    
    try {
      const user = await auth.getCurrentUser();
      if (!user) return 'offline';
      
      const { data, error } = await supabase
        .from('sync_status')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) return 'error';
      
      return data?.status as 'online' | 'offline' | 'syncing' | 'error' || 'online';
    } catch (error) {
      console.error("Error getting sync status:", error);
      return 'error';
    }
  }

  async updateSyncStatus(status: 'online' | 'offline' | 'syncing' | 'error'): Promise<void> {
    try {
      const user = await auth.getCurrentUser();
      if (!user) return;
      
      await supabase.from('sync_status').upsert({
        user_id: user.id,
        status,
        last_sync: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error updating sync status:", error);
    }
  }

  subscribeToNotesChanges(callback: (notes: Note[]) => void): () => void {
    this.notesChangeCallbacks.push(callback);
    
    return () => {
      this.notesChangeCallbacks = this.notesChangeCallbacks.filter(cb => cb !== callback);
    };
  }

  private handleNotesChange(notes: Note[]): void {
    this.notesChangeCallbacks.forEach(callback => callback(notes));
  }
}

export const noteService = new NoteService();
