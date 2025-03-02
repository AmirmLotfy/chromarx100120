
import { Bookmark, Search } from "lucide-react";
import { motion } from "framer-motion";

const BookmarkSearchView = () => {
  return (
    <motion.div 
      className="flex-1 flex flex-col items-center justify-center p-6 text-center"
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
        <Search className="h-8 w-8 text-primary/80" />
      </motion.div>
      <h3 className="text-xl font-medium mb-3">Bookmark Search</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        Enter a search term to find content across your bookmarks.
      </p>
    </motion.div>
  );
};

export default BookmarkSearchView;
