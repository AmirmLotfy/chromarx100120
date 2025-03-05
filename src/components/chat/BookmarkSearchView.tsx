
import { BookmarkPlus, Search, Sparkles, Globe } from "lucide-react";
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
      className="flex-1 flex flex-col items-center justify-start px-3 py-6 text-center max-h-[calc(100vh-10rem)] overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center mb-5 shadow-inner"
      >
        <BookmarkPlus className="h-8 w-8 text-primary/70" strokeWidth={1.5} />
      </motion.div>
      
      <h3 className="text-lg font-medium">Search Your Bookmarks</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        Find and explore your bookmarked content using natural language
      </p>
      
      {/* Enhanced AI/Web search toggle */}
      <div className="flex items-center justify-center gap-2 mb-7 bg-muted/30 p-1 rounded-full shadow-sm">
        <button 
          className={cn(
            "text-sm flex items-center gap-1.5 py-2 px-3 rounded-full transition-all",
            !webSearchEnabled 
              ? "bg-background shadow-sm text-foreground" 
              : "text-muted-foreground"
          )}
          onClick={() => setWebSearchEnabled(false)}
        >
          <BookmarkPlus className="h-4 w-4" />
          <span>Bookmarks only</span>
        </button>
        
        <button
          className={cn(
            "text-sm flex items-center gap-1.5 py-2 px-3 rounded-full transition-all",
            webSearchEnabled 
              ? "bg-background shadow-sm text-foreground" 
              : "text-muted-foreground"
          )}
          onClick={() => setWebSearchEnabled(true)}
        >
          <Globe className="h-4 w-4" />
          <span>Web search</span>
        </button>
      </div>
      
      <div className="w-full max-w-md space-y-4 mb-6 overflow-y-auto hide-scrollbar">
        <h4 className="text-sm font-medium text-muted-foreground">Try asking:</h4>
        <div className="grid grid-cols-1 gap-2">
          {searchExamples.map((example, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <Button 
                variant="outline" 
                className="w-full justify-start text-left h-auto py-3 px-4 text-sm group hover:border-primary/30"
                size="sm"
              >
                <Search className="h-4 w-4 mr-2 text-primary/70 flex-shrink-0 group-hover:text-primary" />
                <span className="truncate">{example}</span>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
      
      {webSearchEnabled && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="w-full max-w-md mt-2"
        >
          <div className="text-sm py-3 px-4 bg-primary/5 rounded-lg border border-primary/10 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary/70" />
            <span>Web search is enabled. Your queries will search both bookmarks and the web.</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default BookmarkSearchView;
