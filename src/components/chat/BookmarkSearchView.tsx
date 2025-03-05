
import { BookmarkPlus, Search, Sparkles, Globe, ArrowRight, MagnifyingGlass } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
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
      className="flex-1 flex flex-col items-center justify-start px-6 py-10 text-center max-h-[calc(100vh-10rem)] overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center mb-8 shadow-lg border border-primary/10"
      >
        <BookmarkPlus className="h-12 w-12 text-primary" strokeWidth={1.5} />
      </motion.div>
      
      <h3 className="text-2xl font-medium mb-3">Search Your Bookmarks</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-10">
        Find and explore your bookmarked content using natural language
      </p>
      
      {/* Enhanced AI/Web search toggle */}
      <div className="flex items-center justify-center gap-2 mb-10 p-1 rounded-full border border-muted/30 w-full max-w-md bg-background/50 backdrop-blur-sm">
        <button 
          className={cn(
            "text-sm flex items-center gap-2 py-3 px-5 rounded-full transition-all w-1/2 justify-center font-medium",
            !webSearchEnabled 
              ? "bg-primary text-primary-foreground shadow-sm" 
              : "text-muted-foreground hover:bg-muted/50"
          )}
          onClick={() => setWebSearchEnabled(false)}
        >
          <BookmarkPlus className="h-4 w-4" />
          <span>Bookmarks only</span>
        </button>
        
        <button
          className={cn(
            "text-sm flex items-center gap-2 py-3 px-5 rounded-full transition-all w-1/2 justify-center font-medium",
            webSearchEnabled 
              ? "bg-primary text-primary-foreground shadow-sm" 
              : "text-muted-foreground hover:bg-muted/50"
          )}
          onClick={() => setWebSearchEnabled(true)}
        >
          <Globe className="h-4 w-4" />
          <span>Web search</span>
        </button>
      </div>
      
      <div className="w-full max-w-md space-y-5 mb-8 overflow-y-auto hide-scrollbar px-2">
        <h4 className="text-sm font-medium text-muted-foreground">Try asking:</h4>
        <div className="grid grid-cols-1 gap-3">
          {searchExamples.map((example, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <Button 
                variant="outline" 
                className="w-full justify-start text-left h-auto py-4 px-5 text-sm group border-primary/10 hover:border-primary/30 bg-background/50 hover:bg-background"
                size="sm"
              >
                <Search className="h-4 w-4 mr-3 text-primary flex-shrink-0" />
                <span className="truncate">{example}</span>
                <ArrowRight className="h-3.5 w-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
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
          className="w-full max-w-md mt-2 px-2"
        >
          <div className="text-sm py-4 px-5 bg-primary/5 rounded-xl border border-primary/10 flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>Web search is enabled. Your queries will search both bookmarks and the web.</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default BookmarkSearchView;
