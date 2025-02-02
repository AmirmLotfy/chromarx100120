import { Note } from "@/types/note";
import { Task } from "@/types/task";
import { ChromeBookmark } from "@/types/bookmark";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, BookmarkPlus, ListTodo } from "lucide-react";
import { toast } from "sonner";

interface NoteActionsProps {
  note: Note;
  onConvertToTask: (note: Note) => void;
  onLinkBookmark: (note: Note) => void;
}

const NoteActions = ({ note, onConvertToTask, onLinkBookmark }: NoteActionsProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onConvertToTask(note)}>
          <ListTodo className="h-4 w-4 mr-2" />
          Convert to Task
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onLinkBookmark(note)}>
          <BookmarkPlus className="h-4 w-4 mr-2" />
          Link Bookmark
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NoteActions;