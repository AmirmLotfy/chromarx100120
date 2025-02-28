
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Folder, Tag, X, Search, Filter, ChevronDown } from "lucide-react";
import { noteService } from "@/services/noteService";
import { NoteFolder, Note, NoteSort, NoteSortOption, NoteSortDirection } from "@/types/note";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface NoteOrganizerProps {
  notes: Note[];
  onFilterChange: (notes: Note[]) => void;
  onSortChange: (sort: NoteSort) => void;
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  selectedTags: string[];
  onSelectTag: (tag: string) => void;
  selectedFolder: string | null;
  onSelectFolder: (folderId: string | null) => void;
  currentSort: NoteSort;
}

const NoteOrganizer = ({
  notes,
  onFilterChange,
  onSortChange,
  selectedCategory,
  onSelectCategory,
  selectedTags,
  onSelectTag,
  selectedFolder,
  onSelectFolder,
  currentSort,
}: NoteOrganizerProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  // Extract unique categories and tags from notes
  useEffect(() => {
    const categories = Array.from(new Set(notes.map(note => note.category))).filter(Boolean);
    const tags = Array.from(new Set(notes.flatMap(note => note.tags || []))).filter(Boolean);
    
    setAllCategories(categories as string[]);
    setAllTags(tags as string[]);
  }, [notes]);

  // Load folders from storage
  useEffect(() => {
    const loadFolders = async () => {
      try {
        const storedFolders = localStorage.getItem("note_folders");
        if (storedFolders) {
          setFolders(JSON.parse(storedFolders));
        }
      } catch (error) {
        console.error("Error loading folders:", error);
      }
    };
    
    loadFolders();
  }, []);

  // Save folders to storage when they change
  useEffect(() => {
    localStorage.setItem("note_folders", JSON.stringify(folders));
  }, [folders]);

  // Handle search and apply filters
  useEffect(() => {
    let filteredNotes = [...notes];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredNotes = filteredNotes.filter(
        note => 
          note.title.toLowerCase().includes(query) || 
          note.content.toLowerCase().includes(query)
      );
    }
    
    // Apply category filter
    if (selectedCategory) {
      filteredNotes = filteredNotes.filter(note => note.category === selectedCategory);
    }
    
    // Apply tag filters
    if (selectedTags.length > 0) {
      filteredNotes = filteredNotes.filter(note => 
        selectedTags.every(tag => note.tags?.includes(tag))
      );
    }
    
    // Apply folder filter
    if (selectedFolder) {
      filteredNotes = filteredNotes.filter(note => note.folderId === selectedFolder);
    }
    
    // Notify parent component about filtered notes
    onFilterChange(filteredNotes);
  }, [searchQuery, selectedCategory, selectedTags, selectedFolder, notes, onFilterChange]);

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast.error("Folder name cannot be empty");
      return;
    }

    const newFolder: NoteFolder = {
      id: crypto.randomUUID(),
      name: newFolderName.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setFolders([...folders, newFolder]);
    setNewFolderName("");
    setIsCreatingFolder(false);
    toast.success(`Folder "${newFolderName}" created`);
  };

  const handleSortChange = (field: NoteSortOption, direction: NoteSortDirection) => {
    onSortChange({ field, direction });
  };

  const toggleTag = (tag: string) => {
    onSelectTag(tag);
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-background/50 backdrop-blur-sm">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search notes..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Sort Options */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Sort by</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              {currentSort.field === 'updatedAt' ? 'Last Updated' : 
               currentSort.field === 'createdAt' ? 'Created Date' : 
               currentSort.field === 'title' ? 'Title' : 'Category'}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleSortChange('updatedAt', currentSort.direction)}>
              Last Updated
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSortChange('createdAt', currentSort.direction)}>
              Created Date
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSortChange('title', currentSort.direction)}>
              Title
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSortChange('category', currentSort.direction)}>
              Category
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="ml-2"
          onClick={() => handleSortChange(
            currentSort.field, 
            currentSort.direction === 'asc' ? 'desc' : 'asc'
          )}
        >
          {currentSort.direction === 'asc' ? '↑' : '↓'}
        </Button>
      </div>

      {/* Folders */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Folders</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsCreatingFolder(!isCreatingFolder)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {isCreatingFolder && (
          <div className="flex items-center gap-2 mb-2">
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="New folder name"
              className="h-8"
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleCreateFolder}
            >
              Add
            </Button>
          </div>
        )}
        
        <ScrollArea className="h-28">
          <div className="space-y-1">
            <Button
              variant={selectedFolder === null ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start"
              onClick={() => onSelectFolder(null)}
            >
              <Folder className="h-4 w-4 mr-2" />
              All Notes
            </Button>
            
            {folders.map(folder => (
              <Button
                key={folder.id}
                variant={selectedFolder === folder.id ? "secondary" : "ghost"}
                size="sm"
                className="w-full justify-start"
                onClick={() => onSelectFolder(folder.id)}
              >
                <Folder className="h-4 w-4 mr-2" style={{ color: folder.color }} />
                {folder.name}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-sm font-medium mb-2">Categories</h3>
        <ScrollArea className="h-28">
          <div className="space-y-1">
            <Button
              variant={selectedCategory === null ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start"
              onClick={() => onSelectCategory(null)}
            >
              All Categories
            </Button>
            
            {allCategories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "secondary" : "ghost"}
                size="sm"
                className="w-full justify-start"
                onClick={() => onSelectCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Tags */}
      <div>
        <h3 className="text-sm font-medium mb-2">Tags</h3>
        <ScrollArea className="h-28">
          <div className="flex flex-wrap gap-2">
            {allTags.map(tag => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className={cn(
                  "cursor-pointer",
                  selectedTags.includes(tag) ? "bg-primary" : "bg-background"
                )}
                onClick={() => toggleTag(tag)}
              >
                {tag}
                {selectedTags.includes(tag) && (
                  <X className="h-3 w-3 ml-1" />
                )}
              </Badge>
            ))}
            
            {allTags.length === 0 && (
              <div className="text-sm text-muted-foreground p-2">
                No tags found
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default NoteOrganizer;
