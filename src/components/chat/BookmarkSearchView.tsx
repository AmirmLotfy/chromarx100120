
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
        className="w-24 h-24 bg-gradient-to-br from-primary/30 to-primary/5 rounded-full flex items-center justify-center mb-8 shadow-inner"
      >
        <Search className="h-10 w-10 text-primary/80" strokeWidth={1.5} />
      </motion.div>
      <h3 className="text-2xl font-medium mb-3">Search Bookmarks</h3>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
        Find content across your saved bookmarks with natural language search
      </p>
    </motion.div>
  );
};

export default BookmarkSearchView;
