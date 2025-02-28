
import { Note } from "@/types/note";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Trash, 
  Edit, 
  BarChart, 
  CheckSquare, 
  Link, 
  Folder, 
  Pin, 
  Tag,
  MoreVertical 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { noteService } from "@/services/noteService";
import { toast } from "sonner";

interface NoteCardProps {
  note: Note;
  isSelected: boolean;
  onSelect: (note: Note) => void;
  onDelete: (id: string) => void;
  onEdit: (note: Note) => void;
  onAnalyze: (note: Note) => void;
  onConvertToTask: (note: Note) => void;
  onLinkBookmark: (note: Note) => void;
  onMoveToFolder?: (noteId: string, folderId: string) => void;
}

const NoteCard = ({
  note,
  isSelected,
  onSelect,
  onDelete,
  onEdit,
  onAnalyze,
  onConvertToTask,
  onLinkBookmark,
  onMoveToFolder,
}: NoteCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [folders, setFolders] = useState<any[]>([]);

  // Load folders when the move dialog is opened
  const handleOpenMoveDialog = () => {
    try {
      const storedFolders = localStorage.getItem("note_folders");
      if (storedFolders) {
        setFolders(JSON.parse(storedFolders));
      }
    } catch (error) {
      console.error("Error loading folders:", error);
    }
    setShowMoveDialog(true);
  };

  const handleTogglePin = async () => {
    try {
      const updatedNote = {
        ...note,
        pinned: !note.pinned
      };
      
      await noteService.updateNote(updatedNote);
      onEdit(updatedNote);
      toast.success(updatedNote.pinned ? "Note pinned" : "Note unpinned");
    } catch (error) {
      console.error("Error toggling pin:", error);
      toast.error("Failed to update note");
    }
  };

  const handleMoveToFolder = (folderId: string) => {
    if (onMoveToFolder) {
      onMoveToFolder(note.id, folderId);
    }
    setShowMoveDialog(false);
  };

  const getSentimentColor = (sentiment?: string) => {
    if (!sentiment) return "";
    switch (sentiment) {
      case "positive":
        return "text-green-500";
      case "negative":
        return "text-red-500";
      case "neutral":
        return "text-blue-500";
      default:
        return "";
    }
  };

  return (
    <Card
      className={cn(
        "h-full transition-all duration-200 hover:shadow-md",
        isSelected ? "border-primary shadow-sm" : "shadow-sm",
        isHovered ? "shadow-md" : "",
        note.pinned ? "border-yellow-400 border-2" : ""
      )}
      style={{ backgroundColor: note.color || "var(--card)" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(note)}
    >
      <CardHeader className="flex flex-row items-start justify-between p-4">
        <h3 className="font-semibold text-base line-clamp-2">{note.title}</h3>
        <div className="flex items-center space-x-1">
          {note.pinned && <Pin className="h-4 w-4 text-yellow-500" />}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onEdit(note);
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                handleTogglePin();
              }}>
                <Pin className="h-4 w-4 mr-2" />
                {note.pinned ? "Unpin" : "Pin"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onAnalyze(note);
              }}>
                <BarChart className="h-4 w-4 mr-2" />
                Analyze
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onConvertToTask(note);
              }}>
                <CheckSquare className="h-4 w-4 mr-2" />
                Convert to Task
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onLinkBookmark(note);
              }}>
                <Link className="h-4 w-4 mr-2" />
                Link Bookmark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                handleOpenMoveDialog();
              }}>
                <Folder className="h-4 w-4 mr-2" />
                Move to Folder
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(note.id);
                }}
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {note.content}
        </p>
      </CardContent>

      <CardFooter className="flex flex-col items-start p-4 pt-0 space-y-2">
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {note.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
            {note.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{note.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
          <span className="flex items-center">
            {note.category && (
              <Badge variant="secondary" className="text-xs mr-2">
                {note.category}
              </Badge>
            )}
            {note.sentiment && (
              <span className={cn("text-xs", getSentimentColor(note.sentiment))}>
                {note.sentiment}
              </span>
            )}
          </span>
          <span className="text-xs">
            {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
          </span>
        </div>
      </CardFooter>

      {/* Move to Folder Dialog */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Move to Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {folders.length > 0 ? (
                folders.map(folder => (
                  <Button
                    key={folder.id}
                    variant="outline"
                    className="w-full justify-start text-left"
                    onClick={() => handleMoveToFolder(folder.id)}
                  >
                    <Folder className="h-4 w-4 mr-2" />
                    {folder.name}
                  </Button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No folders found. Create a folder first.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default NoteCard;
