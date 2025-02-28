
import { Note } from "@/types/note";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { chromeDb } from "@/lib/chrome-storage";

type DatabaseNote = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  created_at: string;
  updated_at: string;
  sentiment?: string;
  sentiment_details?: any;
  summary?: string;
  task_id?: string;
  bookmark_ids?: string[];
};

export class NoteService {
  private static instance: NoteService;
  private syncInProgress = false;

  private constructor() {}

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
      sentiment: note.sentiment,
      sentiment_details: note.sentimentDetails,
      summary: note.summary,
      task_id: note.taskId,
      bookmark_ids: note.bookmarkIds,
    };
  }

  async getAllNotes(): Promise<Note[]> {
    try {
      // First try to get from localStorage for quick load
      const localNotes = localStorage.getItem("notes");
      const parsedLocalNotes = localNotes ? JSON.parse(localNotes) : [];

      // Then try to get from Supabase if user is authenticated
      const user = await this.getCurrentUser();
      if (user) {
        const { data: supabaseNotes, error } = await supabase
          .from("notes")
          .select("*")
          .order("updated_at", { ascending: false });

        if (error) throw error;

        // Transform and update localStorage with latest data from Supabase
        if (supabaseNotes) {
          const transformedNotes = supabaseNotes.map(this.toNote);
          localStorage.setItem("notes", JSON.stringify(transformedNotes));
          return transformedNotes;
        }
      }

      return parsedLocalNotes;
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
      };

      // Save to localStorage first for immediate feedback
      const localNotes = await this.getAllNotes();
      localStorage.setItem("notes", JSON.stringify([newNote, ...localNotes]));

      // If user is authenticated, save to Supabase
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
          sentiment: newNote.sentiment,
          sentiment_details: newNote.sentimentDetails,
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
      // Update localStorage first
      const localNotes = await this.getAllNotes();
      const updatedLocalNotes = localNotes.map((n) =>
        n.id === note.id ? note : n
      );
      localStorage.setItem("notes", JSON.stringify(updatedLocalNotes));

      // If user is authenticated, update Supabase
      const user = await this.getCurrentUser();
      if (user) {
        const dbNote = {
          id: note.id,
          user_id: user.id,
          title: note.title,
          content: note.content,
          tags: note.tags || [],
          category: note.category || "uncategorized",
          created_at: note.createdAt,
          updated_at: note.updatedAt,
          sentiment: note.sentiment,
          sentiment_details: note.sentimentDetails,
          summary: note.summary,
          task_id: note.taskId,
          bookmark_ids: note.bookmarkIds,
        };
        
        const { data, error } = await supabase
          .from("notes")
          .update(dbNote)
          .eq("id", note.id)
          .select()
          .single();

        if (error) throw error;
        return this.toNote(data);
      }

      return note;
    } catch (error) {
      console.error("Error updating note:", error);
      toast.error("Failed to update note");
      return null;
    }
  }

  async deleteNote(noteId: string): Promise<boolean> {
    try {
      // Delete from localStorage first
      const localNotes = await this.getAllNotes();
      const filteredNotes = localNotes.filter((n) => n.id !== noteId);
      localStorage.setItem("notes", JSON.stringify(filteredNotes));

      // If user is authenticated, delete from Supabase
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

      const localNotes = await this.getAllNotes();
      
      // Get latest notes from Supabase
      const { data: supabaseNotes, error } = await supabase
        .from("notes")
        .select("*");

      if (error) throw error;

      // Transform and merge notes based on timestamps
      const transformedSupabaseNotes = (supabaseNotes || []).map(this.toNote);
      const mergedNotes = this.mergeNotes(localNotes, transformedSupabaseNotes);

      // Update localStorage
      localStorage.setItem("notes", JSON.stringify(mergedNotes));

      // Update Supabase - create complete DB notes with all required fields
      const dbNotes = mergedNotes.map(note => ({
        id: note.id,
        user_id: user.id,
        title: note.title,
        content: note.content,
        tags: note.tags || [],
        category: note.category || "uncategorized",
        created_at: note.createdAt,
        updated_at: note.updatedAt,
        sentiment: note.sentiment,
        sentiment_details: note.sentimentDetails,
        summary: note.summary,
        task_id: note.taskId,
        bookmark_ids: note.bookmarkIds,
      }));
      
      const { error: upsertError } = await supabase
        .from("notes")
        .upsert(dbNotes);

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

    // Add all Supabase notes to the map
    supabaseNotes.forEach((note) => {
      notesMap.set(note.id, note);
    });

    // Merge local notes, keeping the most recently updated version
    localNotes.forEach((localNote) => {
      const supabaseNote = notesMap.get(localNote.id);
      if (!supabaseNote || new Date(localNote.updatedAt) > new Date(supabaseNote.updatedAt)) {
        notesMap.set(localNote.id, localNote);
      }
    });

    return Array.from(notesMap.values());
  }

  private async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  // Set up real-time subscription for notes
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
}

export const noteService = NoteService.getInstance();
