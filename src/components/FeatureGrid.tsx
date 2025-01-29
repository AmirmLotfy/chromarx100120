import { Link } from "react-router-dom";
import { BookmarkIcon, Clock, FileText, ListTodo } from "lucide-react";

const FeatureGrid = () => {
  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      <Link 
        to="/bookmarks" 
        className="flex flex-col items-center justify-center p-6 rounded-xl bg-[#0EA5E9] text-white hover:bg-[#0284C7] transition-colors"
      >
        <BookmarkIcon className="h-8 w-8 mb-2" />
        <span className="text-sm font-medium">Bookmarks</span>
      </Link>
      
      <Link 
        to="/tasks" 
        className="flex flex-col items-center justify-center p-6 rounded-xl bg-[#8B5CF6] text-white hover:bg-[#7C3AED] transition-colors"
      >
        <ListTodo className="h-8 w-8 mb-2" />
        <span className="text-sm font-medium">Tasks</span>
      </Link>
      
      <Link 
        to="/notes" 
        className="flex flex-col items-center justify-center p-6 rounded-xl bg-[#D946EF] text-white hover:bg-[#C026D3] transition-colors"
      >
        <FileText className="h-8 w-8 mb-2" />
        <span className="text-sm font-medium">Notes</span>
      </Link>
      
      <Link 
        to="/timer" 
        className="flex flex-col items-center justify-center p-6 rounded-xl bg-[#F59E0B] text-white hover:bg-[#D97706] transition-colors"
      >
        <Clock className="h-8 w-8 mb-2" />
        <span className="text-sm font-medium">Timer</span>
      </Link>
    </div>
  );
};

export default FeatureGrid;