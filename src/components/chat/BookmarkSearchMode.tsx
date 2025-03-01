
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SearchX, Info, Search, BookmarkIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface BookmarkSearchModeProps {
  onClose: () => void;
}

const BookmarkSearchMode: React.FC<BookmarkSearchModeProps> = ({ onClose }) => {
  return (
    <motion.div 
      className="px-4 py-2"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <Alert 
        variant="default" 
        className="bg-accent/50 border border-primary/20 rounded-xl shadow-sm"
      >
        <div className="flex items-center space-x-2">
          <div className="rounded-full bg-primary/10 p-1.5">
            <BookmarkIcon className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-base font-medium">Bookmark Search</h3>
        </div>
        
        <AlertDescription className="text-sm mt-3 text-foreground/80">
          Describe the bookmark you're looking for using keywords, topics, or content you remember.
        </AlertDescription>
        
        <div className="mt-3 space-y-2 bg-background/50 p-3 rounded-lg border border-border/50">
          <div className="flex items-center text-xs text-foreground/70">
            <Search className="h-3 w-3 mr-2 text-primary/70" />
            <span>"article about climate change with graphs"</span>
          </div>
          <div className="flex items-center text-xs text-foreground/70">
            <Search className="h-3 w-3 mr-2 text-primary/70" />
            <span>"python tutorial with code examples"</span>
          </div>
          <div className="flex items-center text-xs text-foreground/70">
            <Search className="h-3 w-3 mr-2 text-primary/70" />
            <span>"recipe with avocado and chicken"</span>
          </div>
        </div>
        
        <div className="flex justify-end mt-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClose}
            className="text-xs h-8 font-medium"
          >
            Exit Search Mode
          </Button>
        </div>
      </Alert>
    </motion.div>
  );
};

export default BookmarkSearchMode;
