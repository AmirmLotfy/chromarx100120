
import React from "react";
import { List, Grid } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ViewToggleProps {
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
}

const ViewToggle = ({ view, onViewChange }: ViewToggleProps) => {
  return (
    <div className="flex items-center justify-center p-1 bg-background/80 backdrop-blur-sm border rounded-full shadow-sm">
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => onViewChange("list")}
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200",
          view === "list" 
            ? "bg-primary text-primary-foreground shadow-sm" 
            : "text-muted-foreground hover:bg-muted"
        )}
        aria-label="List view"
      >
        <List className="h-4 w-4" />
      </motion.button>
      
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => onViewChange("grid")}
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200",
          view === "grid" 
            ? "bg-primary text-primary-foreground shadow-sm" 
            : "text-muted-foreground hover:bg-muted"
        )}
        aria-label="Grid view"
      >
        <Grid className="h-4 w-4" />
      </motion.button>
    </div>
  );
};

export default ViewToggle;
