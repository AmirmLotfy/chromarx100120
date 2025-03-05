
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
      className="flex-1 flex flex-col items-center justify-start p-4 text-center min-h-[200px] max-h-[calc(100vh-10rem)] overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center mb-4 shadow-inner"
      >
        <BookmarkPlus className="h-7 w-7 text-primary/70" strokeWidth={1.5} />
      </motion.div>
      
      <h3 className="text-base font-medium">Search Your Bookmarks</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-5">
        Find and explore your bookmarked content using natural language
      </p>
      
      {/* Enhanced AI/Web search toggle */}
      <div className="flex items-center justify-center gap-3 mb-6 bg-muted/50 py-3 px-4 rounded-full shadow-sm">
        <span className={cn("text-sm transition-colors flex items-center gap-1.5", !webSearchEnabled && "text-muted-foreground")}>
          <BookmarkPlus className="h-4 w-4" />
          <span>Bookmarks only</span>
        </span>
        <Switch 
          checked={webSearchEnabled} 
          onCheckedChange={setWebSearchEnabled}
          className="data-[state=checked]:bg-primary/90"
        />
        <span className={cn("text-sm flex items-center gap-1.5 transition-colors", webSearchEnabled ? "text-primary" : "text-muted-foreground")}>
          <Globe className="h-4 w-4" />
          <span>Web search</span>
        </span>
      </div>
      
      <div className="w-full max-w-md space-y-3 mb-5 overflow-y-auto hide-scrollbar">
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
                className="w-full justify-start text-left h-auto py-2 px-3 text-sm group hover:border-primary/30"
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
        <div className="w-full max-w-md mt-2">
          <div className="text-sm text-center py-3 px-4 bg-primary/5 rounded-lg border border-primary/10 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary/70" />
            <span>Web search is enabled. Your queries will search both bookmarks and the web.</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default BookmarkSearchView;
