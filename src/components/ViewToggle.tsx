
import { Button } from "@/components/ui/button";
import { Grid, List } from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewToggleProps {
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
}

const ViewToggle = ({ view, onViewChange }: ViewToggleProps) => {
  console.log("ViewToggle rendered with view:", view);
  
  return (
    <div className="flex items-center gap-1 sm:gap-2 rounded-full bg-accent/20 p-0.5">
      <Button 
        onClick={() => {
          console.log("Grid button clicked");
          onViewChange("grid");
        }} 
        variant={view === "grid" ? "default" : "ghost"} 
        size="sm"
        className={cn(
          "will-change-transform transition-all duration-300 rounded-full h-8 w-8 p-0",
          view === "grid" ? "shadow-sm bg-background text-primary" : "text-muted-foreground",
        )}
        aria-label="Grid view"
      >
        <Grid className="h-4 w-4" />
      </Button>
      <Button 
        onClick={() => {
          console.log("List button clicked");
          onViewChange("list");
        }} 
        variant={view === "list" ? "default" : "ghost"} 
        size="sm"
        className={cn(
          "will-change-transform transition-all duration-300 rounded-full h-8 w-8 p-0",
          view === "list" ? "shadow-sm bg-background text-primary" : "text-muted-foreground",
        )}
        aria-label="List view"
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ViewToggle;
