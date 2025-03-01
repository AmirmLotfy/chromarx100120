import { useState, useEffect, useCallback, useRef } from "react";
import Layout from "@/components/Layout";
import NoteGrid from "@/components/notes/NoteGrid";
import NoteOrganizer from "@/components/notes/NoteOrganizer";
import { Note, NoteSort } from "@/types/note";
import { Button } from "@/components/ui/button";
import { Plus, List, LayoutGrid, CloudCog, CloudOff, AlertTriangle } from "lucide-react";
import { noteService } from "@/services/noteService";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { auth } from "@/lib/chrome-utils";

const NotesPage = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<NoteSort>({
    field: "updatedAt",
    direction: "desc",
  });
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'online' | 'offline' | 'error'>('online');
  const lastSyncTimeRef = useRef<Date>(new Date());
  const pendingChangesRef = useRef<Set<string>>(new Set());
  const channelRef = useRef<any>(null);

  useEffect(() => {
    loadNotes();
    
    // Subscribe to note changes
    const unsubscribe = noteService.subscribeToNotesChanges((updatedNotes) => {
      setNotes(updatedNotes);
      setFilteredNotes(updatedNotes);
    });

    // Setup Supabase real-time subscription
    setupRealtimeSubscription();
    
    // Setup online/offline detection
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      unsubscribe();
      cleanupRealtimeSubscription();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const setupRealtimeSubscription = async () => {
    try {
      const user = await auth.getCurrentUser();
      if (!user) {
        console.log("No user found, not setting up realtime subscription");
        return;
      }

      // Clean up existing subscription if any
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      // Setup realtime subscription to notes table
      channelRef.current = supabase.channel('notes-changes')
        .on('postgres_changes', 
          {
            event: '*',
            schema: 'public',
            table: 'notes',
            filter: `user_id=eq.${user.id}`
          }, 
          handleRealtimeUpdate
        )
        .subscribe(status => {
          console.log('Realtime subscription status:', status);
          if (status === 'SUBSCRIBED') {
            setSyncStatus('online');
          }
        });
    } catch (error) {
      console.error("Error setting up realtime subscription:", error);
      setSyncStatus('error');
    }
  };

  const cleanupRealtimeSubscription = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  };

  const handleRealtimeUpdate = async (payload: any) => {
    console.log("Received realtime update:", payload);
    try {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      
      // Skip if this is our own change (to avoid loops)
      if (pendingChangesRef.current.has(newRecord?.id)) {
        pendingChangesRef.current.delete(newRecord?.id);
        console.log("Skipping own change for note:", newRecord?.id);
        return;
      }
      
      // Handle different event types
      switch (eventType) {
        case 'INSERT':
          // Merge the new note if it doesn't exist locally
          if (!notes.some(note => note.id === newRecord.id)) {
            // Transform from DB format to app format if needed
            const newNote: Note = {
              id: newRecord.id,
              title: newRecord.title,
              content: newRecord.content,
              tags: newRecord.tags || [],
              category: newRecord.category || 'uncategorized',
              createdAt: newRecord.created_at,
              updatedAt: newRecord.updated_at,
              sentiment: newRecord.sentiment,
              sentimentDetails: newRecord.sentiment_details,
              summary: newRecord.summary,
              taskId: newRecord.task_id,
              bookmarkIds: newRecord.bookmark_ids,
              folderId: newRecord.folder_id,
              pinned: newRecord.pinned,
              color: newRecord.color,
              version: newRecord.version || 1
            };
            
            setNotes(prevNotes => [newNote, ...prevNotes]);
            setFilteredNotes(prevFiltered => [newNote, ...prevFiltered]);
            toast.info(`New note "${newNote.title}" received`);
          }
          break;
          
        case 'UPDATE':
          // Check for conflicts
          const existingNote = notes.find(note => note.id === newRecord.id);
          if (existingNote) {
            // If local version is newer than the server version, we have a conflict
            const localVersion = existingNote.version || 1;
            const serverVersion = newRecord.version || 1;
            
            if (localVersion > serverVersion) {
              // Local changes are newer, prompt user for resolution
              handleSyncConflict(existingNote, newRecord);
            } else {
              // Server changes are newer, update local note
              const updatedNote: Note = {
                ...existingNote,
                title: newRecord.title,
                content: newRecord.content,
                tags: newRecord.tags || [],
                category: newRecord.category || 'uncategorized',
                updatedAt: newRecord.updated_at,
                sentiment: newRecord.sentiment,
                sentimentDetails: newRecord.sentiment_details,
                summary: newRecord.summary,
                taskId: newRecord.task_id,
                bookmarkIds: newRecord.bookmark_ids,
                folderId: newRecord.folder_id,
                pinned: newRecord.pinned,
                color: newRecord.color,
                version: newRecord.version || 1
              };
              
              handleEditNote(updatedNote);
              toast.info(`Note "${updatedNote.title}" was updated`);
            }
          }
          break;
          
        case 'DELETE':
          // Remove the note if it exists locally
          if (notes.some(note => note.id === oldRecord.id)) {
            setNotes(prevNotes => prevNotes.filter(note => note.id !== oldRecord.id));
            setFilteredNotes(prevFiltered => prevFiltered.filter(note => note.id !== oldRecord.id));
            
            // Also remove from selected notes if it was selected
            setSelectedNotes(prev => {
              const newSet = new Set(prev);
              newSet.delete(oldRecord.id);
              return newSet;
            });
            
            toast.info(`Note was deleted remotely`);
          }
          break;
      }
      
      // Update last sync time
      lastSyncTimeRef.current = new Date();
    } catch (error) {
      console.error("Error handling realtime update:", error);
      toast.error("Error syncing changes");
      setSyncStatus('error');
    }
  };

  const handleSyncConflict = (localNote: Note, serverNote: any) => {
    // Show conflict resolution UI
    toast.error(
      <div className="flex flex-col space-y-2">
        <div className="font-medium">Sync conflict detected</div>
        <div className="text-sm">There are conflicting changes to note "{localNote.title}"</div>
        <div className="flex space-x-2 pt-2">
          <Button size="sm" variant="destructive" onClick={() => resolveConflict(serverNote, 'server')}>
            Use remote version
          </Button>
          <Button size="sm" variant="default" onClick={() => resolveConflict(localNote, 'local')}>
            Keep my version
          </Button>
          <Button size="sm" variant="outline" onClick={() => resolveConflict(localNote, 'merge')}>
            Merge changes
          </Button>
        </div>
      </div>,
      {
        duration: 10000,
        id: `conflict-${localNote.id}`
      }
    );
  };

  const resolveConflict = async (note: Note | any, resolution: 'server' | 'local' | 'merge') => {
    try {
      let resolvedNote: Note;
      
      if (resolution === 'server') {
        // Use server version
        resolvedNote = {
          id: note.id,
          title: note.title,
          content: note.content,
          tags: note.tags || [],
          category: note.category || 'uncategorized',
          createdAt: note.created_at || note.createdAt,
          updatedAt: note.updated_at || note.updatedAt,
          sentiment: note.sentiment,
          sentimentDetails: note.sentiment_details || note.sentimentDetails,
          summary: note.summary,
          taskId: note.task_id || note.taskId,
          bookmarkIds: note.bookmark_ids || note.bookmarkIds,
          folderId: note.folder_id || note.folderId,
          pinned: note.pinned,
          color: note.color,
          version: (note.version || 1) + 1
        };
      } else if (resolution === 'local') {
        // Use local version but increment version
        const localNote = notes.find(n => n.id === note.id);
        if (!localNote) throw new Error("Local note not found");
        
        resolvedNote = {
          ...localNote,
          version: (localNote.version || 1) + 1
        };
      } else {
        // Merge changes (most complex case)
        const localNote = notes.find(n => n.id === note.id);
        if (!localNote) throw new Error("Local note not found");
        
        // Simple merge strategy: combine tags, take most recent content based on timestamp
        const serverUpdatedAt = new Date(note.updated_at || note.updatedAt);
        const localUpdatedAt = new Date(localNote.updatedAt);
        
        // Combine unique tags
        const combinedTags = Array.from(new Set([...localNote.tags, ...(note.tags || [])]));
        
        resolvedNote = {
          ...localNote,
          title: serverUpdatedAt > localUpdatedAt ? note.title : localNote.title,
          content: serverUpdatedAt > localUpdatedAt ? note.content : localNote.content,
          tags: combinedTags,
          updatedAt: new Date().toISOString(),
          version: Math.max((localNote.version || 1), (note.version || 1)) + 1
        };
      }
      
      // Mark this note as having pending changes to avoid loop
      pendingChangesRef.current.add(resolvedNote.id);
      
      // Update locally and on server
      await noteService.updateNote(resolvedNote);
      handleEditNote(resolvedNote);
      
      toast.success("Conflict resolved successfully");
    } catch (error) {
      console.error("Error resolving conflict:", error);
      toast.error("Failed to resolve conflict");
    }
  };

  const handleOnline = () => {
    setSyncStatus('online');
    toast.success("You're back online! Syncing notes...");
    handleSyncNotes();
    setupRealtimeSubscription();
  };

  const handleOffline = () => {
    setSyncStatus('offline');
    toast.warning("You're offline. Changes will be saved locally and synced when you're back online.");
    cleanupRealtimeSubscription();
  };

  const loadNotes = async () => {
    setLoading(true);
    try {
      const notes = await noteService.getAllNotes();
      setNotes(notes);
      setFilteredNotes(notes);
    } catch (error) {
      console.error("Error loading notes:", error);
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectNote = (note: Note) => {
    setSelectedNotes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(note.id)) {
        newSet.delete(note.id);
      } else {
        newSet.add(note.id);
      }
      return newSet;
    });
  };

  const handleDeleteNote = async (id: string) => {
    try {
      setSyncStatus('syncing');
      await noteService.deleteNote(id);
      setNotes(notes.filter((note) => note.id !== id));
      setFilteredNotes(filteredNotes.filter((note) => note.id !== id));
      setSelectedNotes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      toast.success("Note deleted");
      setSyncStatus('online');
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
      setSyncStatus('error');
    }
  };

  const handleEditNote = useCallback((updatedNote: Note) => {
    // Mark this note as having pending changes to avoid update loops
    pendingChangesRef.current.add(updatedNote.id);
    
    setNotes(prevNotes => 
      prevNotes.map(note => note.id === updatedNote.id ? updatedNote : note)
    );
    
    setFilteredNotes(prevFiltered => 
      prevFiltered.map(note => note.id === updatedNote.id ? updatedNote : note)
    );
  }, []);

  const handleUpdateNote = async (updatedNote: Note) => {
    try {
      setSyncStatus('syncing');
      
      // Increment version number before saving
      const noteToUpdate = {
        ...updatedNote,
        version: (updatedNote.version || 1) + 1
      };
      
      // Mark this note as having pending changes to avoid update loops
      pendingChangesRef.current.add(noteToUpdate.id);
      
      await noteService.updateNote(noteToUpdate);
      handleEditNote(noteToUpdate);
      
      setSyncStatus('online');
      lastSyncTimeRef.current = new Date();
    } catch (error) {
      console.error("Error updating note:", error);
      toast.error("Failed to update note");
      setSyncStatus('error');
    }
  };

  const handleAnalyzeNote = (note: Note) => {
    toast.info("Analyzing note...");
    // Implement note analysis functionality
  };

  const handleConvertToTask = (note: Note) => {
    toast.info("Converting to task...");
    // Implement conversion to task
  };

  const handleLinkBookmark = (note: Note) => {
    toast.info("Linking bookmark...");
    // Implement bookmark linking
  };

  const handleCreateNote = async () => {
    try {
      setSyncStatus('syncing');
      
      const newNote: Omit<Note, "id"> = {
        title: "New Note",
        content: "",
        tags: [],
        category: "uncategorized",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      };
      
      const createdNote = await noteService.createNote(newNote);
      if (createdNote) {
        // Mark this note as having pending changes to avoid update loops
        pendingChangesRef.current.add(createdNote.id);
        
        setNotes([createdNote, ...notes]);
        setFilteredNotes([createdNote, ...filteredNotes]);
        toast.success("New note created");
        setSyncStatus('online');
        lastSyncTimeRef.current = new Date();
      }
    } catch (error) {
      console.error("Error creating note:", error);
      toast.error("Failed to create note");
      setSyncStatus('error');
    }
  };

  const handleMoveToFolder = async (noteId: string, folderId: string) => {
    try {
      setSyncStatus('syncing');
      
      const noteToUpdate = notes.find(note => note.id === noteId);
      if (!noteToUpdate) return;
      
      const updatedNote = {
        ...noteToUpdate,
        folderId: folderId,
        version: (noteToUpdate.version || 1) + 1
      };
      
      // Mark this note as having pending changes to avoid update loops
      pendingChangesRef.current.add(updatedNote.id);
      
      const result = await noteService.updateNote(updatedNote);
      if (result) {
        handleEditNote(updatedNote);
        toast.success("Note moved to folder");
        setSyncStatus('online');
        lastSyncTimeRef.current = new Date();
      }
    } catch (error) {
      console.error("Error moving note to folder:", error);
      toast.error("Failed to move note");
      setSyncStatus('error');
    }
  };

  const handleSelectTag = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  const handleSyncNotes = async () => {
    try {
      setSyncStatus('syncing');
      toast.loading("Syncing notes...");
      await noteService.syncNotesWithSupabase();
      await loadNotes();
      setSyncStatus('online');
      lastSyncTimeRef.current = new Date();
      toast.success("Notes synced successfully");
    } catch (error) {
      console.error("Error syncing notes:", error);
      toast.error("Failed to sync notes");
      setSyncStatus('error');
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">Notes</h1>
            <p className="text-muted-foreground">
              {filteredNotes.length} note{filteredNotes.length !== 1 && "s"}
            </p>
          </div>
          <div className="flex mt-4 sm:mt-0 space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={handleSyncNotes} 
                    variant="outline"
                    className={cn(
                      "relative",
                      syncStatus === 'syncing' && "animate-pulse",
                      syncStatus === 'error' && "border-red-500"
                    )}
                  >
                    {syncStatus === 'online' && <CloudCog className="h-4 w-4 mr-2 text-green-500" />}
                    {syncStatus === 'offline' && <CloudOff className="h-4 w-4 mr-2 text-gray-500" />}
                    {syncStatus === 'syncing' && <CloudCog className="h-4 w-4 mr-2 text-blue-500 animate-spin" />}
                    {syncStatus === 'error' && <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />}
                    {syncStatus === 'online' && "Synced"}
                    {syncStatus === 'offline' && "Offline"}
                    {syncStatus === 'syncing' && "Syncing..."}
                    {syncStatus === 'error' && "Sync Error"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {syncStatus === 'online' && `Last synced: ${lastSyncTimeRef.current.toLocaleTimeString()}`}
                  {syncStatus === 'offline' && "Working offline. Changes will sync when you're back online."}
                  {syncStatus === 'syncing' && "Syncing changes..."}
                  {syncStatus === 'error' && "Error syncing. Click to retry."}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Button onClick={() => setView(view === "grid" ? "list" : "grid")} variant="outline">
              {view === "grid" ? (
                <List className="h-4 w-4 mr-2" />
              ) : (
                <LayoutGrid className="h-4 w-4 mr-2" />
              )}
              {view === "grid" ? "List View" : "Grid View"}
            </Button>
            <Button onClick={handleCreateNote}>
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <NoteOrganizer
              notes={notes}
              onFilterChange={setFilteredNotes}
              onSortChange={setSort}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              selectedTags={selectedTags}
              onSelectTag={handleSelectTag}
              selectedFolder={selectedFolder}
              onSelectFolder={setSelectedFolder}
              currentSort={sort}
            />
          </div>
          <div className="md:col-span-3">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <p>Loading notes...</p>
              </div>
            ) : (
              <NoteGrid
                notes={filteredNotes}
                selectedNotes={selectedNotes}
                onSelectNote={handleSelectNote}
                onDeleteNote={handleDeleteNote}
                onEditNote={handleUpdateNote}
                onAnalyzeNote={handleAnalyzeNote}
                onConvertToTask={handleConvertToTask}
                onLinkBookmark={handleLinkBookmark}
                onMoveToFolder={handleMoveToFolder}
                sort={sort}
                view={view}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotesPage;
