
import React from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { SearchX, Info, Search, BookmarkIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface BookmarkSearchModeProps {
  onClose: () => void;
}

const BookmarkSearchMode: React.FC<BookmarkSearchModeProps> = ({ onClose }) => {
  return (
    <motion.div 
      className="px-4 py-3"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Alert variant="default" className="bg-primary/10 border-primary/20">
        <BookmarkIcon className="h-4 w-4 mr-2" />
        <AlertTitle className="flex items-center text-base font-medium">
          Bookmark Search Mode
        </AlertTitle>
        <AlertDescription className="text-sm mt-2">
          Describe the bookmark you're looking for using keywords, topics, or content you remember.
          The AI will search through your bookmarks to find matches.
        </AlertDescription>
        <div className="mt-3">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center text-xs text-muted-foreground">
              <Search className="h-3 w-3 mr-1" />
              <span>Example: "that article about climate change with graphs"</span>
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Search className="h-3 w-3 mr-1" />
              <span>Example: "python tutorial with code examples"</span>
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Search className="h-3 w-3 mr-1" />
              <span>Example: "recipe with avocado and chicken"</span>
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClose}
            className="text-xs px-2 py-1 h-7"
          >
            Exit Search Mode
          </Button>
        </div>
      </Alert>
    </motion.div>
  );
};

export default BookmarkSearchMode;
