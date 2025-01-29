import { Grid3X3, List } from "lucide-react";
import { Button } from "./ui/button";

interface ViewToggleProps {
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
}

const ViewToggle = ({ view, onViewChange }: ViewToggleProps) => {
  return (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onViewChange("list")}
        className={view === "list" ? "bg-accent" : ""}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onViewChange("grid")}
        className={view === "grid" ? "bg-accent" : ""}
      >
        <Grid3X3 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ViewToggle;