import { Note } from "@/types/note";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { chromeDb } from "@/lib/chrome-storage";
import { getGeminiResponse } from "@/utils/geminiUtils";
import { useLanguage } from "@/stores/languageStore";

type DatabaseNote = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  created_at: string;
  updated_at: string;
  version?: number;
  sentiment?: string;
  sentiment_details?: any;
  summary?: string;
  task_id?: string;
  bookmark_ids?: string[];
};

export class NoteService {
  private static instance: NoteService;
  private syncInProgress = false;
  private realTimeSubscription: any = null;
  private activeListeners: Set<(notes: Note[]) => void> = new Set();

  private constructor() {
    this.setupRealtimeSubscription();
  }

  static getInstance(): NoteService {
    if (!this.instance) {
      this.instance = new NoteService();
    }
    return this.instance;
  }

  private toNote(dbNote: DatabaseNote): Note {
    return {
      id: dbNote.id,
      title: dbNote.title,
      content: dbNote.content,
      tags: dbNote.tags,
      category: dbNote.category,
      createdAt: dbNote.created_at,
      updatedAt: dbNote.updated_at,
      version: dbNote.version || 1,
      sentiment: dbNote.sentiment as Note["sentiment"],
      sentimentDetails: dbNote.sentiment_details,
      summary: dbNote.summary,
      taskId: dbNote.task_id,
      bookmarkIds: dbNote.bookmark_ids,
    };
  }

  private toDatabaseNote(note: Partial<Note>, userId?: string): Partial<DatabaseNote> {
    return {
      id: note.id,
      user_id: userId,
      title: note.title,
      content: note.content,
      tags: note.tags,
      category: note.category,
      created_at: note.createdAt,
      updated_at: note.updatedAt,
      version: note.version || 1,
      sentiment: note.sentiment,
      sentiment_details: note.sentimentDetails ? JSON.parse(JSON.stringify(note.sentimentDetails)) : null,
      summary: note.summary,
      task_id: note.taskId,
      bookmark_ids: note.bookmarkIds,
    };
  }

  private setupRealtimeSubscription() {
    this.getCurrentUser().then(user => {
      if (!user) return;

      if (this.realTimeSubscription) {
        this.realTimeSubscription.unsubscribe();
      }

      this.realTimeSubscription = supabase
        .channel('notes-changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'notes',
            filter: `user_id=eq.${user.id}`
          }, 
          async (payload) => {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const note = this.toNote(payload.new as DatabaseNote);
              
              const localNotes = await this.getAllNotesFromStorage();
              const updatedNotes = this.mergeNote(localNotes, note);
              
              localStorage.setItem("notes", JSON.stringify(updatedNotes));
              
              this.notifyListeners(updatedNotes);
            } else if (payload.eventType === 'DELETE') {
              const deletedId = (payload.old as DatabaseNote).id;
              
              const localNotes = await this.getAllNotesFromStorage();
              const updatedNotes = localNotes.filter(note => note.id !== deletedId);
              
              localStorage.setItem("notes", JSON.stringify(updatedNotes));
              
              this.notifyListeners(updatedNotes);
            }
          }
        )
        .subscribe();
    }).catch(error => {
      console.error("Error setting up real-time subscription:", error);
    });
  }

  subscribeToNotesChanges(listener: (notes: Note[]) => void): () => void {
    this.activeListeners.add(listener);
    
    return () => {
      this.activeListeners.delete(listener);
    };
  }

  private notifyListeners(notes: Note[]) {
    this.activeListeners.forEach(listener => {
      listener(notes);
    });
  }

  private async getAllNotesFromStorage(): Promise<Note[]> {
    const localNotes = localStorage.getItem("notes");
    return localNotes ? JSON.parse(localNotes) : [];
  }

  async getAllNotes(): Promise<Note[]> {
    try {
      const localNotes = await this.getAllNotesFromStorage();

      const user = await this.getCurrentUser();
      if (user) {
        const { data: supabaseNotes, error } = await supabase
          .from("notes")
          .select("*")
          .order("updated_at", { ascending: false });

        if (error) throw error;

        if (supabaseNotes) {
          const transformedNotes = supabaseNotes.map(this.toNote);
          const mergedNotes = this.mergeNotes(localNotes, transformedNotes);
          localStorage.setItem("notes", JSON.stringify(mergedNotes));
          return mergedNotes;
        }
      }

      return localNotes;
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast.error("Failed to fetch notes");
      return [];
    }
  }

  async createNote(note: Omit<Note, "id">): Promise<Note | null> {
    try {
      const user = await this.getCurrentUser();
      const newNote = {
        ...note,
        id: crypto.randomUUID(),
        version: 1,
      };

      const localNotes = await this.getAllNotesFromStorage();
      localStorage.setItem("notes", JSON.stringify([newNote, ...localNotes]));

      this.notifyListeners([newNote, ...localNotes]);

      if (user) {
        const dbNote = {
          id: newNote.id,
          user_id: user.id,
          title: newNote.title,
          content: newNote.content,
          tags: newNote.tags || [],
          category: newNote.category || "uncategorized",
          created_at: newNote.createdAt,
          updated_at: newNote.updatedAt,
          version: newNote.version || 1,
          sentiment: newNote.sentiment,
          sentiment_details: newNote.sentimentDetails ? JSON.parse(JSON.stringify(newNote.sentimentDetails)) : null,
          summary: newNote.summary,
          task_id: newNote.taskId,
          bookmark_ids: newNote.bookmarkIds,
        };
        
        const { data, error } = await supabase
          .from("notes")
          .insert([dbNote])
          .select()
          .single();

        if (error) throw error;
        return this.toNote(data);
      }

      return newNote;
    } catch (error) {
      console.error("Error creating note:", error);
      toast.error("Failed to create note");
      return null;
    }
  }

  async updateNote(note: Note): Promise<Note | null> {
    try {
      const updatedNote = {
        ...note,
        version: (note.version || 1) + 1,
        updatedAt: new Date().toISOString(),
      };

      const localNotes = await this.getAllNotesFromStorage();
      const updatedLocalNotes = localNotes.map((n) =>
        n.id === updatedNote.id ? updatedNote : n
      );
      localStorage.setItem("notes", JSON.stringify(updatedLocalNotes));
      
      this.notifyListeners(updatedLocalNotes);

      const user = await this.getCurrentUser();
      if (user) {
        const dbNote = {
          id: updatedNote.id,
          user_id: user.id,
          title: updatedNote.title,
          content: updatedNote.content,
          tags: updatedNote.tags || [],
          category: updatedNote.category || "uncategorized",
          created_at: updatedNote.createdAt,
          updated_at: updatedNote.updatedAt,
          version: updatedNote.version,
          sentiment: updatedNote.sentiment,
          sentiment_details: updatedNote.sentimentDetails ? JSON.parse(JSON.stringify(updatedNote.sentimentDetails)) : null,
          summary: updatedNote.summary,
          task_id: updatedNote.taskId,
          bookmark_ids: updatedNote.bookmarkIds,
        };
        
        const { data, error } = await supabase
          .from("notes")
          .update(dbNote)
          .eq("id", updatedNote.id)
          .lt("version", updatedNote.version)
          .select()
          .single();

        if (error) {
          if (error.code === "23505") {
            toast.warning("This note was modified by another device. Refreshing with latest changes.");
            await this.getAllNotes();
            return null;
          }
          throw error;
        }
        
        return this.toNote(data);
      }

      return updatedNote;
    } catch (error) {
      console.error("Error updating note:", error);
      toast.error("Failed to update note");
      return null;
    }
  }

  async deleteNote(noteId: string): Promise<boolean> {
    try {
      const localNotes = await this.getAllNotesFromStorage();
      const filteredNotes = localNotes.filter((n) => n.id !== noteId);
      localStorage.setItem("notes", JSON.stringify(filteredNotes));
      
      this.notifyListeners(filteredNotes);

      const user = await this.getCurrentUser();
      if (user) {
        const { error } = await supabase
          .from("notes")
          .delete()
          .eq("id", noteId);

        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
      return false;
    }
  }

  async syncNotesWithSupabase(): Promise<void> {
    if (this.syncInProgress) return;

    try {
      this.syncInProgress = true;
      const user = await this.getCurrentUser();
      if (!user) return;

      const localNotes = await this.getAllNotesFromStorage();
      
      const { data: supabaseNotes, error } = await supabase
        .from("notes")
        .select("*");

      if (error) throw error;

      const transformedSupabaseNotes = (supabaseNotes || []).map(this.toNote);
      const mergedNotes = this.mergeNotes(localNotes, transformedSupabaseNotes);

      localStorage.setItem("notes", JSON.stringify(mergedNotes));
      
      this.notifyListeners(mergedNotes);

      const dbNotes = mergedNotes.map(note => ({
        id: note.id,
        user_id: user.id,
        title: note.title,
        content: note.content,
        tags: note.tags || [],
        category: note.category || "uncategorized",
        created_at: note.createdAt,
        updated_at: note.updatedAt,
        version: note.version || 1,
        sentiment: note.sentiment,
        sentiment_details: note.sentimentDetails ? JSON.parse(JSON.stringify(note.sentimentDetails)) : null,
        summary: note.summary,
        task_id: note.taskId,
        bookmark_ids: note.bookmarkIds,
      }));
      
      const { error: upsertError } = await supabase
        .from("notes")
        .upsert(dbNotes, { 
          onConflict: 'id',
          ignoreDuplicates: false
        });

      if (upsertError) throw upsertError;

      toast.success("Notes synced successfully");
    } catch (error) {
      console.error("Error syncing notes:", error);
      toast.error("Failed to sync notes");
    } finally {
      this.syncInProgress = false;
    }
  }

  private mergeNotes(localNotes: Note[], supabaseNotes: Note[]): Note[] {
    const notesMap = new Map<string, Note>();

    supabaseNotes.forEach((note) => {
      notesMap.set(note.id, note);
    });

    localNotes.forEach((localNote) => {
      const supabaseNote = notesMap.get(localNote.id);
      if (!supabaseNote) {
        notesMap.set(localNote.id, localNote);
      } else {
        const localVersion = localNote.version || 1;
        const serverVersion = supabaseNote.version || 1;
        
        if (localVersion > serverVersion) {
          notesMap.set(localNote.id, localNote);
        } else if (localVersion === serverVersion) {
          const localUpdated = new Date(localNote.updatedAt);
          const serverUpdated = new Date(supabaseNote.updatedAt);
          if (localUpdated > serverUpdated) {
            notesMap.set(localNote.id, localNote);
          }
        }
      }
    });

    return Array.from(notesMap.values());
  }

  private mergeNote(notes: Note[], updatedNote: Note): Note[] {
    const exists = notes.some(note => note.id === updatedNote.id);
    
    if (exists) {
      return notes.map(note => note.id === updatedNote.id ? updatedNote : note);
    } else {
      return [updatedNote, ...notes];
    }
  }

  private async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  subscribeToNoteChanges(callback: (note: Note) => void) {
    return supabase
      .channel('public:notes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'notes' 
        }, 
        (payload) => {
          callback(this.toNote(payload.new as DatabaseNote));
        }
      )
      .subscribe();
  }

  async suggestCategory(note: Note): Promise<string> {
    try {
      const response = await getGeminiResponse({
        prompt: `Note title: ${note.title}\n\nNote content: ${note.content}\n\nSuggest a single category for this note based on its content. Return just the category name without explanation or additional text.`,
        type: 'categorize',
        language: 'en'
      });
      
      return response.result || "uncategorized";
    } catch (error) {
      console.error("Error suggesting category:", error);
      return "uncategorized";
    }
  }

  async suggestTags(note: Note): Promise<string[]> {
    try {
      const response = await getGeminiResponse({
        prompt: `Note title: ${note.title}\n\nNote content: ${note.content}\n\nSuggest 3-5 relevant tags for this note. Return the tags as a comma-separated list without explanation or additional text.`,
        type: 'categorize',
        language: 'en'
      });
      
      const tags = response.result.split(',').map(tag => tag.trim());
      return tags.filter(tag => tag.length > 0);
    } catch (error) {
      console.error("Error suggesting tags:", error);
      return [];
    }
  }

  async suggestImprovements(note: Note): Promise<string> {
    try {
      const response = await getGeminiResponse({
        prompt: `Note title: ${note.title}\n\nNote content: ${note.content}\n\nSuggest some improvements for this note content. Consider clarity, organization, and completeness. Provide specific suggestions.`,
        type: 'task',
        language: 'en'
      });
      
      return response.result;
    } catch (error) {
      console.error("Error suggesting improvements:", error);
      return "Unable to generate improvement suggestions.";
    }
  }

  async findRelatedNotes(note: Note, allNotes: Note[]): Promise<Note[]> {
    try {
      const otherNotes = allNotes
        .filter(n => n.id !== note.id)
        .slice(0, 20);
      
      if (otherNotes.length === 0) return [];
      
      const noteSummaries = otherNotes.map(n => 
        `ID: ${n.id}\nTitle: ${n.title}\nSummary: ${n.summary || n.content.substring(0, 100)}`
      ).join('\n\n');
      
      const prompt = `Current note:\nTitle: ${note.title}\nContent: ${note.content}\n\nOther notes:\n${noteSummaries}\n\n` +
        `Return the IDs of the 3 most relevant notes to the current note as a comma-separated list. Only include IDs, no other text.`;
      
      const response = await getGeminiResponse({
        prompt,
        type: 'analytics',
        language: 'en'
      });
      
      const relatedIds = response.result.split(',').map(id => id.trim());
      
      return otherNotes.filter(note => relatedIds.includes(note.id));
    } catch (error) {
      console.error("Error finding related notes:", error);
      return [];
    }
  }
}

export const noteService = NoteService.getInstance();
