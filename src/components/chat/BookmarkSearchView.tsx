
import { BookmarkPlus, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "../ui/button";

const BookmarkSearchView = () => {
  const searchExamples = [
    "Find all my bookmarks about React",
    "Show recipes I saved last month",
    "Which coding tutorials did I bookmark?",
    "Find articles about machine learning"
  ];

  return (
    <motion.div 
      className="flex-1 flex flex-col items-center justify-center p-4 text-center min-h-[200px]"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center mb-4 shadow-inner"
      >
        <BookmarkPlus className="h-7 w-7 text-primary/70" strokeWidth={1.5} />
      </motion.div>
      <h3 className="text-base font-medium mb-1">Search Your Bookmarks</h3>
      <p className="text-xs text-muted-foreground max-w-xs mb-4">
        Find and explore your bookmarked content using natural language
      </p>
      
      <div className="w-full max-w-sm space-y-2 mb-3">
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
                <Search className="h-3 w-3 mr-1.5 text-primary/70" />
                {example}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default BookmarkSearchView;
