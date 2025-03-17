import { useState, useEffect, useMemo } from 'react';
import Layout from "@/components/Layout";
import NoteEditor from "@/components/notes/NoteEditor";
import NoteCard from "@/components/notes/NoteCard";
import NoteGrid from "@/components/notes/NoteGrid";
import NoteActions from "@/components/notes/NoteActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, ArrowDownAZ, Filter, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { createNote, getNotes, updateNote, deleteNote } from '@/services/noteService';
import { Note } from '@/types/note';

// Extended note type to ensure it has all required properties from the type definition
interface ExtendedNote extends Note {
  category: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  tags: string[];
}

const NotesPage = () => {
  const [notes, setNotes] = useState<ExtendedNote[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<ExtendedNote | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'alphabetical'>('newest');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSentiment, setFilterSentiment] = useState<string>('all');

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const fetchedNotes = await getNotes();
      // Make sure all notes have the required properties
      const extendedNotes: ExtendedNote[] = fetchedNotes.map(note => ({
        ...note,
        category: note.category || 'General',
        sentiment: (note.sentiment as 'positive' | 'negative' | 'neutral') || 'neutral',
        tags: note.tags || []
      }));
      setNotes(extendedNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
      toast.error('Failed to load notes');
    }
  };

  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const matchesSearch = note.title.toLowerCase().includes(searchText.toLowerCase()) || 
                            note.content.toLowerCase().includes(searchText.toLowerCase()) ||
                            note.tags.some(tag => tag.toLowerCase().includes(searchText.toLowerCase()));
      
      const matchesCategory = filterCategory === 'all' || note.category === filterCategory;
      const matchesSentiment = filterSentiment === 'all' || note.sentiment === filterSentiment;
      
      return matchesSearch && matchesCategory && matchesSentiment;
    });
  }, [notes, searchText, filterCategory, filterSentiment]);

  const sortedNotes = useMemo(() => {
    return [...filteredNotes].sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortOrder === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else {
        return a.title.localeCompare(b.title);
      }
    });
  }, [filteredNotes, sortOrder]);

  const uniqueCategories = useMemo(() => {
    const categories = notes.map(note => note.category);
    return ['all', ...new Set(categories)];
  }, [notes]);

  const handleCreateNote = async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newNote = await createNote({
        ...noteData,
        category: noteData.category || 'General',
        sentiment: (noteData.sentiment as 'positive' | 'negative' | 'neutral') || 'neutral',
        tags: noteData.tags || []
      });
      
      if (newNote) {
        // Ensure the new note has all required properties
        const extendedNote: ExtendedNote = {
          ...newNote,
          category: newNote.category || 'General',
          sentiment: (newNote.sentiment as 'positive' | 'negative' | 'neutral') || 'neutral',
          tags: newNote.tags || []
        };
        
        setNotes(prevNotes => [extendedNote, ...prevNotes]);
        setIsEditorOpen(false);
        toast.success('Note created successfully');
      }
    } catch (error) {
      console.error('Error creating note:', error);
      toast.error('Failed to create note');
    }
  };

  const handleUpdateNote = async (updatedNote: Note) => {
    try {
      const result = await updateNote(updatedNote.id, updatedNote);
      
      if (result) {
        // Ensure the updated note has all required properties
        const extendedNote: ExtendedNote = {
          ...result,
          category: result.category || 'General', 
          sentiment: (result.sentiment as 'positive' | 'negative' | 'neutral') || 'neutral',
          tags: result.tags || []
        };
        
        setNotes(prevNotes => prevNotes.map(note => 
          note.id === extendedNote.id ? extendedNote : note
        ));
        setEditingNote(null);
        setIsEditorOpen(false);
        toast.success('Note updated successfully');
      }
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Failed to update note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId);
      setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
      toast.success('Note deleted successfully');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  const handleEdit = (note: ExtendedNote) => {
    setEditingNote(note);
    setIsEditorOpen(true);
  };

  const getCategoryCount = (category: string) => {
    if (category === 'all') return notes.length;
    return notes.filter(note => note.category === category).length;
  };

  const dummyFn = () => {};

  return (
    <Layout>
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Notes</h1>
            <p className="text-muted-foreground">Organize your thoughts and ideas</p>
          </div>
          <Button onClick={() => setIsEditorOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </Button>
        </div>

        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search notes..." 
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex space-x-2">
            <Select value={sortOrder} onValueChange={(value: 'newest' | 'oldest' | 'alphabetical') => setSortOrder(value)}>
              <SelectTrigger className="w-[180px]">
                <div className="flex items-center">
                  {sortOrder === 'newest' && <Calendar className="h-4 w-4 mr-2" />}
                  {sortOrder === 'oldest' && <Calendar className="h-4 w-4 mr-2" />}
                  {sortOrder === 'alphabetical' && <ArrowDownAZ className="h-4 w-4 mr-2" />}
                  <span>Sort by</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="alphabetical">Alphabetical</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <div className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  <span>Category</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {uniqueCategories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)} ({getCategoryCount(category)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {searchText && (
              <Badge variant="outline" className="bg-primary/10">
                Search: {searchText}
                <button 
                  className="ml-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearchText('')}
                >
                  ✕
                </button>
              </Badge>
            )}
            {filterCategory !== 'all' && (
              <Badge variant="outline" className="bg-primary/10">
                Category: {filterCategory}
                <button 
                  className="ml-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setFilterCategory('all')}
                >
                  ✕
                </button>
              </Badge>
            )}
            {filterSentiment !== 'all' && (
              <Badge variant="outline" className="bg-primary/10">
                Sentiment: {filterSentiment}
                <button 
                  className="ml-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setFilterSentiment('all')}
                >
                  ✕
                </button>
              </Badge>
            )}
          </div>
          
          <Tabs defaultValue="grid">
            <TabsList className="mb-4">
              <TabsTrigger value="grid">Grid View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="grid">
              {sortedNotes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedNotes.map(note => (
                    <NoteCard 
                      key={note.id} 
                      note={note} 
                      onEdit={() => handleEdit(note)} 
                      onDelete={() => handleDeleteNote(note.id)}
                      isSelected={false}
                      onSelect={dummyFn}
                      onAnalyze={dummyFn}
                      onConvertToTask={dummyFn}
                      onLinkBookmark={dummyFn}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No notes found.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setSearchText('');
                      setFilterCategory('all');
                      setFilterSentiment('all');
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="list">
              {sortedNotes.length > 0 ? (
                <div className="space-y-2">
                  {sortedNotes.map(note => (
                    <div key={note.id} className="border rounded-lg p-4 hover:bg-accent transition-colors">
                      <div className="flex justify-between">
                        <h3 className="font-medium">{note.title}</h3>
                        <NoteActions 
                          note={note} 
                          onEdit={() => handleEdit(note)} 
                          onDelete={() => handleDeleteNote(note.id)}
                          onAnalyze={dummyFn}
                          onConvertToTask={dummyFn}
                          onLinkBookmark={dummyFn}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{note.content}</p>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex space-x-1">
                          {note.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No notes found.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setSearchText('');
                      setFilterCategory('all');
                      setFilterSentiment('all');
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingNote ? 'Edit Note' : 'Create New Note'}</DialogTitle>
            <DialogDescription>
              {editingNote ? 'Make changes to your note' : 'Add a new note to your collection'}
            </DialogDescription>
          </DialogHeader>
          
          <NoteEditor 
            note={editingNote} 
            onSave={editingNote ? handleUpdateNote : handleCreateNote}
            onCancel={() => {
              setIsEditorOpen(false);
              setEditingNote(null);
            }}
            defaultCategory="General"
          />
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default NotesPage;
