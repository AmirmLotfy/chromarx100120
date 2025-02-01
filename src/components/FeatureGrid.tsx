import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  BookmarkIcon,
  MessageSquare,
  FileText,
  BarChart,
  Timer,
  CheckSquare,
  StickyNote,
  Package,
} from "lucide-react";

const FeatureGrid = () => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 px-2 sm:px-4 max-w-4xl mx-auto w-full py-2">
      <Link to="/bookmarks" className="no-underline hover:no-underline w-full">
        <Button
          variant="outline"
          className="w-full h-28 sm:h-36 flex flex-col items-center justify-center gap-3 bg-[#9b87f5] hover:bg-[#8a73f4] text-white transition-all duration-200 border-none rounded-lg"
        >
          <BookmarkIcon className="h-8 w-8 sm:h-12 sm:w-12" />
          <span className="font-semibold text-sm sm:text-base tracking-wide">Bookmarks</span>
        </Button>
      </Link>
      
      <Link to="/chat" className="no-underline hover:no-underline w-full">
        <Button
          variant="outline"
          className="w-full h-28 sm:h-36 flex flex-col items-center justify-center gap-3 bg-[#7E69AB] hover:bg-[#6b5e9a] text-white transition-all duration-200 border-none rounded-lg"
        >
          <MessageSquare className="h-8 w-8 sm:h-12 sm:w-12" />
          <span className="font-semibold text-sm sm:text-base tracking-wide">Chat</span>
        </Button>
      </Link>

      <Link to="/summaries" className="no-underline hover:no-underline w-full">
        <Button
          variant="outline"
          className="w-full h-28 sm:h-36 flex flex-col items-center justify-center gap-3 bg-[#D946EF] hover:bg-[#d03f9e] text-white transition-all duration-200 border-none rounded-lg"
        >
          <FileText className="h-8 w-8 sm:h-12 sm:w-12" />
          <span className="font-semibold text-sm sm:text-base tracking-wide">Summaries</span>
        </Button>
      </Link>

      <Link to="/analytics" className="no-underline hover:no-underline w-full">
        <Button
          variant="outline"
          className="w-full h-28 sm:h-36 flex flex-col items-center justify-center gap-3 bg-[#F97316] hover:bg-[#f86a1f] text-white transition-all duration-200 border-none rounded-lg"
        >
          <BarChart className="h-8 w-8 sm:h-12 sm:w-12" />
          <span className="font-semibold text-sm sm:text-base tracking-wide">Analytics</span>
        </Button>
      </Link>

      <Link to="/timer" className="no-underline hover:no-underline w-full">
        <Button
          variant="outline"
          className="w-full h-28 sm:h-36 flex flex-col items-center justify-center gap-3 bg-[#10B981] hover:bg-[#0fa76e] text-white transition-all duration-200 border-none rounded-lg"
        >
          <Timer className="h-8 w-8 sm:h-12 sm:w-12" />
          <span className="font-semibold text-sm sm:text-base tracking-wide">Timer</span>
        </Button>
      </Link>

      <Link to="/tasks" className="no-underline hover:no-underline w-full">
        <Button
          variant="outline"
          className="w-full h-28 sm:h-36 flex flex-col items-center justify-center gap-3 bg-[#6366F1] hover:bg-[#5850d6] text-white transition-all duration-200 border-none rounded-lg"
        >
          <CheckSquare className="h-8 w-8 sm:h-12 sm:w-12" />
          <span className="font-semibold text-sm sm:text-base tracking-wide">Tasks</span>
        </Button>
      </Link>

      <Link to="/notes" className="no-underline hover:no-underline w-full">
        <Button
          variant="outline"
          className="w-full h-28 sm:h-36 flex flex-col items-center justify-center gap-3 bg-[#EC4899] hover:bg-[#d83e8e] text-white transition-all duration-200 border-none rounded-lg"
        >
          <StickyNote className="h-8 w-8 sm:h-12 sm:w-12" />
          <span className="font-semibold text-sm sm:text-base tracking-wide">Notes</span>
        </Button>
      </Link>

      <Link to="/suggested-services" className="no-underline hover:no-underline w-full">
        <Button
          variant="outline"
          className="w-full h-28 sm:h-36 flex flex-col items-center justify-center gap-3 bg-[#14B8A6] hover:bg-[#12a99b] text-white transition-all duration-200 border-none rounded-lg"
        >
          <Package className="h-8 w-8 sm:h-12 sm:w-12" />
          <span className="font-semibold text-sm sm:text-base tracking-wide">Services</span>
        </Button>
      </Link>
    </div>
  );
};

export default FeatureGrid;