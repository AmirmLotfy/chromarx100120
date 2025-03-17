
import React from 'react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash, BarChart2, ArrowRight, Link } from "lucide-react";

interface NoteActionsProps {
  note: any;
  onEdit: () => void;
  onDelete: () => void;
  onAnalyze: () => void;
  onConvertToTask: () => void;
  onLinkBookmark: () => void;
}

const NoteActions: React.FC<NoteActionsProps> = ({ 
  note, 
  onEdit, 
  onDelete,
  onAnalyze,
  onConvertToTask,
  onLinkBookmark
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          <span>Edit</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAnalyze}>
          <BarChart2 className="mr-2 h-4 w-4" />
          <span>Analyze</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onConvertToTask}>
          <ArrowRight className="mr-2 h-4 w-4" />
          <span>Convert to Task</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onLinkBookmark}>
          <Link className="mr-2 h-4 w-4" />
          <span>Link Bookmark</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="text-destructive" onClick={onDelete}>
          <Trash className="mr-2 h-4 w-4" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NoteActions;
