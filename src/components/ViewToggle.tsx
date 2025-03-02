
import React from "react";
import { Button } from "@/components/ui/button";
import { Grid, List } from "lucide-react";
import { motion } from "framer-motion";

interface ViewToggleProps {
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
}

const ViewToggle = ({ view, onViewChange }: ViewToggleProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-1 p-1 bg-muted/50 border rounded-full shadow-sm"
    >
      <Button
        size="icon"
        variant="ghost"
        onClick={() => onViewChange("list")}
        className={`h-7 w-7 rounded-full transition-all ${
          view === "list" 
            ? "bg-white dark:bg-slate-800 shadow-sm text-primary" 
            : "text-muted-foreground"
        }`}
      >
        <List className="h-3.5 w-3.5" />
        <span className="sr-only">List view</span>
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => onViewChange("grid")}
        className={`h-7 w-7 rounded-full transition-all ${
          view === "grid" 
            ? "bg-white dark:bg-slate-800 shadow-sm text-primary" 
            : "text-muted-foreground"
        }`}
      >
        <Grid className="h-3.5 w-3.5" />
        <span className="sr-only">Grid view</span>
      </Button>
    </motion.div>
  );
};

export default ViewToggle;
