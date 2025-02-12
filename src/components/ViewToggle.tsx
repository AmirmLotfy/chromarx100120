
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
    <div className="flex gap-1 sm:gap-2">
      <Button 
        onClick={() => {
          console.log("Grid button clicked");
          onViewChange("grid");
        }} 
        variant={view === "grid" ? "default" : "outline"} 
        size="sm"
        className={cn(
          "transition-all duration-200",
          view === "grid" ? "shadow-sm" : "hover:bg-accent"
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
        variant={view === "list" ? "default" : "outline"} 
        size="sm"
        className={cn(
          "transition-all duration-200",
          view === "list" ? "shadow-sm" : "hover:bg-accent"
        )}
        aria-label="List view"
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ViewToggle;
