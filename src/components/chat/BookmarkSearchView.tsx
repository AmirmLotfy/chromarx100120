
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
      className="flex-1 flex flex-col items-center justify-center p-6 text-center min-h-[300px]"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center mb-6 shadow-inner"
      >
        <BookmarkPlus className="h-8 w-8 text-primary/70" strokeWidth={1.5} />
      </motion.div>
      <h3 className="text-xl font-medium mb-2">Search Your Bookmarks</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">
        Find and explore your bookmarked content using natural language
      </p>
      
      <div className="w-full max-w-sm space-y-3 mb-4">
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
                className="w-full justify-start text-left h-auto py-2 px-3 text-sm"
                size="sm"
              >
                <Search className="h-3.5 w-3.5 mr-2 text-primary/70" />
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
