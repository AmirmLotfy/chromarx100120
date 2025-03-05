
import { BookmarkPlus, Search, Sparkles, Globe, ArrowRight } from "lucide-react";
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
      className="flex-1 flex flex-col items-center justify-start p-6 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-sm border border-primary/10"
      >
        <BookmarkPlus className="h-10 w-10 text-primary" strokeWidth={1.5} />
      </motion.div>
      
      <h3 className="text-xl font-medium mb-2">Search Your Bookmarks</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-8">
        Find and explore your bookmarked content using natural language
      </p>
      
      {/* Enhanced AI/Web search toggle */}
      <div className="flex items-center justify-center gap-2 mb-8 p-1 rounded-full border border-muted/30 w-full max-w-sm bg-background/50 backdrop-blur-sm">
        <button 
          className={cn(
            "text-sm flex items-center gap-2 py-2.5 px-4 rounded-full transition-all w-1/2 justify-center",
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
            "text-sm flex items-center gap-2 py-2.5 px-4 rounded-full transition-all w-1/2 justify-center",
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
      
      <div className="w-full max-w-sm space-y-4 mb-6">
        <h4 className="text-sm font-medium">Try asking:</h4>
        <div className="grid grid-cols-1 gap-2">
          {searchExamples.map((example, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Button 
                variant="outline" 
                className="w-full justify-start text-left h-auto py-3 px-4 text-sm font-normal group"
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
          className="w-full max-w-sm"
        >
          <div className="text-sm py-4 px-5 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium mb-1">Web search is enabled</p>
              <p className="text-xs text-muted-foreground">Your queries will search both bookmarks and the web for more comprehensive results.</p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default BookmarkSearchView;
