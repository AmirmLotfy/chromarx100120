import { Grid3X3, List } from "lucide-react";
import { Button } from "./ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface ViewToggleProps {
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
}

const ViewToggle = ({ view, onViewChange }: ViewToggleProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={view === "list" ? "default" : "ghost"}
        size={isMobile ? "icon" : "sm"}
        onClick={() => onViewChange("list")}
        className="w-8 h-8 p-0"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant={view === "grid" ? "default" : "ghost"}
        size={isMobile ? "icon" : "sm"}
        onClick={() => onViewChange("grid")}
        className="w-8 h-8 p-0"
      >
        <Grid3X3 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ViewToggle;