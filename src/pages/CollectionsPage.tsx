
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronRight, FolderPlus, Grid, Home, LayoutGrid, List, Pencil, Plus, Settings, Share2, Trash } from "lucide-react";
import { toast } from "sonner";
import { chromeDb } from "@/lib/chrome-storage";

// Types
interface BookmarkCollection {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  bookmarkCount: number;
  createdAt: string;
  isPublic: boolean;
}

const COLLECTIONS_STORAGE_KEY = "bookmark-collections";

const CollectionsPage = () => {
  const { user } = useAuth();
  const [collections, setCollections] = useState<BookmarkCollection[]>([]);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDesc, setNewCollectionDesc] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load collections from storage
  useEffect(() => {
    const loadCollections = async () => {
      setIsLoading(true);
      try {
        const storedCollections = await chromeDb.get<BookmarkCollection[]>(COLLECTIONS_STORAGE_KEY);
        if (storedCollections && Array.isArray(storedCollections)) {
          setCollections(storedCollections);
        }
      } catch (error) {
        console.error("Error loading collections:", error);
        toast.error("Failed to load your collections");
      } finally {
        setIsLoading(false);
      }
    };

    loadCollections();
  }, []);

  // Save collections to storage when they change
  const saveCollections = async (newCollections: BookmarkCollection[]) => {
    try {
      await chromeDb.set(COLLECTIONS_STORAGE_KEY, newCollections);
    } catch (error) {
      console.error("Error saving collections:", error);
      toast.error("Failed to save your collections");
    }
  };

  const handleCreateCollection = () => {
    if (!newCollectionName) {
      toast.error("Collection name is required");
      return;
    }
    
    const newCollection: BookmarkCollection = {
      id: `col_${Date.now()}`,
      name: newCollectionName,
      description: newCollectionDesc,
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      icon: "folder",
      bookmarkCount: 0,
      createdAt: new Date().toISOString(),
      isPublic: false
    };
    
    const updatedCollections = [...collections, newCollection];
    setCollections(updatedCollections);
    saveCollections(updatedCollections);
    
    toast.success(`Collection "${newCollectionName}" created`);
    setNewCollectionName("");
    setNewCollectionDesc("");
    setIsDialogOpen(false);
  };

  const handleDeleteCollection = (id: string, name: string) => {
    const updatedCollections = collections.filter(c => c.id !== id);
    setCollections(updatedCollections);
    saveCollections(updatedCollections);
    toast.success(`Collection "${name}" deleted`);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <FolderPlus className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Collections</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="bg-muted p-1 rounded-md">
              <Button 
                variant={view === "grid" ? "default" : "ghost"} 
                size="sm" 
                className="h-8 px-2"
                onClick={() => setView("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button 
                variant={view === "list" ? "default" : "ghost"} 
                size="sm" 
                className="h-8 px-2"
                onClick={() => setView("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-1" />
                  New Collection
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Collection</DialogTitle>
                  <DialogDescription>
                    Create a new collection to organize your bookmarks.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input 
                      id="name" 
                      placeholder="Work Resources, Reading List, etc." 
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Input 
                      id="description" 
                      placeholder="Brief description of this collection" 
                      value={newCollectionDesc}
                      onChange={(e) => setNewCollectionDesc(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateCollection}>Create Collection</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="all" className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Collections</TabsTrigger>
            <TabsTrigger value="shared">Shared</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : collections.length > 0 ? (
          <div className={`grid gap-4 ${view === "grid" ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3" : "grid-cols-1"}`}>
            {collections.map((collection) => (
              <Card key={collection.id} className="overflow-hidden">
                {view === "grid" ? (
                  // Grid View
                  <>
                    <div 
                      className="h-2 w-full" 
                      style={{ backgroundColor: collection.color }}
                    />
                    <CardHeader className="pb-2">
                      <CardTitle className="flex justify-between items-center">
                        <span>{collection.name}</span>
                        {collection.isPublic && (
                          <Share2 className="h-4 w-4 text-muted-foreground" />
                        )}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">{collection.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="text-sm">
                        <span className="font-medium">{collection.bookmarkCount}</span> bookmarks
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-0">
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteCollection(collection.id, collection.name)}
                      >
                        <Trash className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </CardFooter>
                  </>
                ) : (
                  // List View
                  <div className="flex items-center p-4">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center mr-4"
                      style={{ backgroundColor: collection.color }}
                    >
                      <Home className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{collection.name}</h3>
                      <div className="text-sm text-muted-foreground flex items-center">
                        <span>{collection.bookmarkCount} bookmarks</span>
                        {collection.isPublic && (
                          <span className="flex items-center ml-2">
                            <Share2 className="h-3 w-3 mr-1" />
                            Shared
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Button variant="ghost" size="sm" className="mr-1">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteCollection(collection.id, collection.name)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" className="ml-1">
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <FolderPlus className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">No collections yet</h3>
            <p className="text-muted-foreground mb-4">Create your first collection to organize your bookmarks</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Create Collection
            </Button>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default CollectionsPage;
