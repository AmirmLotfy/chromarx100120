import { Button } from "@/components/ui/button";
import { Grid, List } from "lucide-react";

interface ViewToggleProps {
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
}

const ViewToggle = ({ view, onViewChange }: ViewToggleProps) => {
  return (
    <div className="flex gap-2">
      <Button 
        onClick={() => onViewChange("grid")} 
        variant={view === "grid" ? "default" : "outline"} 
        size="icon"
        aria-label="Grid view"
      >
        <Grid className="h-4 w-4" />
      </Button>
      <Button 
        onClick={() => onViewChange("list")} 
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