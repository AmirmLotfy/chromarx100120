
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FolderPlus } from "lucide-react";
import { toast } from "sonner";

interface FolderCreationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: (name: string, parentId?: string) => Promise<void>;
  currentParentId?: string;
}

const FolderCreationDialog = ({
  isOpen,
  onClose,
  onCreateFolder,
  currentParentId,
}: FolderCreationDialogProps) => {
  const [folderName, setFolderName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!folderName.trim()) {
      toast.error("Please enter a folder name");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onCreateFolder(folderName, currentParentId);
      setFolderName("");
      onClose();
      toast.success(`Folder "${folderName}" created successfully`);
    } catch (error) {
      console.error("Error creating folder:", error);
      toast.error("Failed to create folder");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5" />
            Create New Folder
          </DialogTitle>
          <DialogDescription>
            Enter a name for your new bookmark folder.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="folderName" className="text-right">
                Folder Name
              </Label>
              <Input
                id="folderName"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                className="col-span-3"
                autoFocus
                placeholder="My Folder"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !folderName.trim()}>
              {isSubmitting ? "Creating..." : "Create Folder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FolderCreationDialog;
