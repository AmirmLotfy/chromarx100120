
import { BookmarkPlus, Search, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { useState } from "react";
import { cn } from "@/lib/utils";

const BookmarkSearchView = () => {
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);
  
  const searchExamples = [
    "Find all my bookmarks about React",
    "Show recipes I saved last month",
    "Which coding tutorials did I bookmark?",
    "Find articles about machine learning"
  ];

  return (
    <motion.div 
      className="flex-1 flex flex-col items-center justify-start p-3 text-center min-h-[200px] max-h-[calc(100vh-12rem)] overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center mb-3 shadow-inner"
      >
        <BookmarkPlus className="h-6 w-6 text-primary/70" strokeWidth={1.5} />
      </motion.div>
      
      <h3 className="text-sm font-medium">Search Your Bookmarks</h3>
      <p className="text-xs text-muted-foreground max-w-xs mb-3">
        Find and explore your bookmarked content using natural language
      </p>
      
      {/* Search mode toggle */}
      <div className="flex items-center justify-center gap-2 mb-4 bg-muted/50 py-1.5 px-3 rounded-full">
        <span className={cn("text-xs transition-colors", !webSearchEnabled && "text-muted-foreground")}>Bookmarks only</span>
        <Switch 
          checked={webSearchEnabled} 
          onCheckedChange={setWebSearchEnabled}
          className="data-[state=checked]:bg-primary/90"
        />
        <span className={cn("text-xs flex items-center gap-1 transition-colors", webSearchEnabled ? "text-primary" : "text-muted-foreground")}>
          <Sparkles className="h-3 w-3" />
          <span>Web search</span>
        </span>
      </div>
      
      <div className="w-full max-w-sm space-y-2 mb-3 overflow-y-auto hide-scrollbar">
        <h4 className="text-xs font-medium text-muted-foreground">Try asking:</h4>
        <div className="grid grid-cols-1 gap-1.5">
          {searchExamples.map((example, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <Button 
                variant="outline" 
                className="w-full justify-start text-left h-auto py-1.5 px-2 text-xs"
                size="sm"
              >
                <Search className="h-3 w-3 mr-1.5 text-primary/70 flex-shrink-0" />
                <span className="truncate">{example}</span>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
      
      {webSearchEnabled && (
        <div className="w-full max-w-sm mt-2">
          <div className="text-xs text-center py-2 px-3 bg-primary/5 rounded-lg border border-primary/10">
            <Sparkles className="inline-block h-3 w-3 text-primary/70 mr-1" />
            Web search is enabled. Your queries will search both bookmarks and the web.
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default BookmarkSearchView;
