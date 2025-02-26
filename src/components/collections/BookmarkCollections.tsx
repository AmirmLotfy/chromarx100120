
import { useState, useEffect } from "react";
import { BookmarkCollection } from "@/types/bookmark-metadata";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Folder, FolderPlus, MoreVertical, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";

interface BookmarkCollectionsProps {
  userId: string;
  onSelectCollection: (collection: BookmarkCollection | null) => void;
  selectedCollectionId?: string;
}

const BookmarkCollections = ({ userId, onSelectCollection, selectedCollectionId }: BookmarkCollectionsProps) => {
  const [collections, setCollections] = useState<BookmarkCollection[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadCollections();
  }, [userId]);

  const loadCollections = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('bookmark_collections')
        .select('*')
        .eq('user_id', userId)
        .order('name');

      if (error) throw error;
      setCollections(data || []);
    } catch (error) {
      console.error('Error loading collections:', error);
      toast.error('Failed to load collections');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      toast.error('Please enter a collection name');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('bookmark_collections')
        .insert({
          name: newCollectionName.trim(),
          description: newCollectionDescription.trim() || null,
          user_id: userId,
          is_public: false
        })
        .select()
        .single();

      if (error) throw error;

      setCollections([...collections, data]);
      setIsCreating(false);
      setNewCollectionName("");
      setNewCollectionDescription("");
      toast.success('Collection created successfully');
    } catch (error) {
      console.error('Error creating collection:', error);
      toast.error('Failed to create collection');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setIsDragging(false);

    if (!over || active.id === over.id) return;

    try {
      // Update collections order
      const oldIndex = collections.findIndex(col => col.id === active.id);
      const newIndex = collections.findIndex(col => col.id === over.id);

      const updatedCollections = [...collections];
      const [movedItem] = updatedCollections.splice(oldIndex, 1);
      updatedCollections.splice(newIndex, 0, movedItem);

      setCollections(updatedCollections);

      // Update in database with position as a number
      const position = newIndex;
      await supabase.from('bookmark_collections')
        .update({ order: position })
        .eq('id', String(active.id)); // Convert ID to string

      toast.success('Collection order updated');
    } catch (error) {
      console.error('Error reordering collections:', error);
      toast.error('Failed to update collection order');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Collections</h2>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-gradient-to-r from-accent to-muted hover:from-accent/90 hover:to-muted/90 transition-all duration-300 shadow-sm"
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              New Collection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Collection</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Name
                </label>
                <Input
                  id="name"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="My Collection"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description (optional)
                </label>
                <Input
                  id="description"
                  value={newCollectionDescription}
                  onChange={(e) => setNewCollectionDescription(e.target.value)}
                  placeholder="Collection description"
                />
              </div>
              <Button onClick={handleCreateCollection} className="w-full">
                Create Collection
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd} onDragStart={() => setIsDragging(true)}>
        <SortableContext items={collections.map(c => c.id)} strategy={verticalListSortingStrategy}>
          <div className="grid gap-2">
            <Button
              variant="ghost"
              className={cn(
                "justify-start h-9 px-2 w-full",
                !selectedCollectionId && "bg-primary/10 text-primary",
                isDragging && "cursor-grabbing"
              )}
              onClick={() => onSelectCollection(null)}
            >
              <Folder className="h-4 w-4 mr-2" />
              All Bookmarks
            </Button>
            {collections.map((collection) => (
              <Button
                key={collection.id}
                variant="ghost"
                className={cn(
                  "justify-start h-9 px-2 w-full",
                  selectedCollectionId === collection.id && "bg-primary/10 text-primary",
                  isDragging && "cursor-grabbing"
                )}
                onClick={() => onSelectCollection(collection)}
                data-draggable-id={collection.id}
              >
                <Folder className="h-4 w-4 mr-2" />
                <span className="flex-1 text-left truncate">{collection.name}</span>
                {collection.description && (
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {collection.description}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default BookmarkCollections;
