
import { useState, useEffect } from "react";
import { BookmarkCollection } from "@/types/bookmark-metadata";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Folder, FolderPlus, MoreVertical } from "lucide-react";
import { toast } from "sonner";

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

  useEffect(() => {
    loadCollections();
  }, [userId]);

  const loadCollections = async () => {
    try {
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Collections</h2>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
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

      <div className="grid gap-2">
        <Button
          variant="ghost"
          className={`justify-start h-9 px-2 w-full ${!selectedCollectionId ? 'bg-primary/10 text-primary' : ''}`}
          onClick={() => onSelectCollection(null)}
        >
          <Folder className="h-4 w-4 mr-2" />
          All Bookmarks
        </Button>
        {collections.map((collection) => (
          <Button
            key={collection.id}
            variant="ghost"
            className={`justify-start h-9 px-2 w-full ${selectedCollectionId === collection.id ? 'bg-primary/10 text-primary' : ''}`}
            onClick={() => onSelectCollection(collection)}
          >
            <Folder className="h-4 w-4 mr-2" />
            <span className="flex-1 text-left">{collection.name}</span>
            <span className="text-xs text-muted-foreground"></span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default BookmarkCollections;
