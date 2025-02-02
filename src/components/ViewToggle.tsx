import { Button } from "@/components/ui/button";
import { Grid, List } from "lucide-react";

interface ViewToggleProps {
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
}

const ViewToggle = ({ view, onViewChange }: ViewToggleProps) => {
  console.log("ViewToggle rendered with view:", view);
  
  return (
    <div className="flex gap-2">
      <Button 
        onClick={() => {
          console.log("Grid button clicked");
          onViewChange("grid");
        }} 
        variant={view === "grid" ? "default" : "outline"} 
        size="icon"
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
        size="icon"
        aria-label="List view"
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ViewToggle;