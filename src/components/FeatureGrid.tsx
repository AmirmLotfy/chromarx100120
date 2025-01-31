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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-2 sm:px-4 max-w-4xl mx-auto w-full">
      <Link to="/bookmarks" className="no-underline hover:no-underline">
        <Button
          variant="outline"
          className="w-full h-20 sm:h-24 flex flex-col items-center justify-center gap-2 bg-[#9b87f5] hover:bg-gradient-to-br hover:from-[#9b87f5] hover:to-[#D6BCFA] text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border-none"
        >
          <BookmarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="font-medium text-sm sm:text-base">Bookmarks</span>
        </Button>
      </Link>
      
      <Link to="/chat" className="no-underline hover:no-underline">
        <Button
          variant="outline"
          className="w-full h-20 sm:h-24 flex flex-col items-center justify-center gap-2 bg-[#7E69AB] hover:bg-gradient-to-br hover:from-[#7E69AB] hover:to-[#9b87f5] text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border-none"
        >
          <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="font-medium text-sm sm:text-base">Chat</span>
        </Button>
      </Link>

      <Link to="/summaries" className="no-underline hover:no-underline">
        <Button
          variant="outline"
          className="w-full h-20 sm:h-24 flex flex-col items-center justify-center gap-2 bg-[#D946EF] hover:bg-gradient-to-br hover:from-[#D946EF] hover:to-[#E879F9] text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border-none"
        >
          <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="font-medium text-sm sm:text-base">Summaries</span>
        </Button>
      </Link>

      <Link to="/analytics" className="no-underline hover:no-underline">
        <Button
          variant="outline"
          className="w-full h-20 sm:h-24 flex flex-col items-center justify-center gap-2 bg-[#F97316] hover:bg-gradient-to-br hover:from-[#F97316] hover:to-[#FB923C] text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border-none"
        >
          <BarChart className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="font-medium text-sm sm:text-base">Analytics</span>
        </Button>
      </Link>

      <Link to="/timer" className="no-underline hover:no-underline">
        <Button
          variant="outline"
          className="w-full h-20 sm:h-24 flex flex-col items-center justify-center gap-2 bg-[#10B981] hover:bg-gradient-to-br hover:from-[#10B981] hover:to-[#34D399] text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border-none"
        >
          <Timer className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="font-medium text-sm sm:text-base">Timer</span>
        </Button>
      </Link>

      <Link to="/tasks" className="no-underline hover:no-underline">
        <Button
          variant="outline"
          className="w-full h-20 sm:h-24 flex flex-col items-center justify-center gap-2 bg-[#6366F1] hover:bg-gradient-to-br hover:from-[#6366F1] hover:to-[#818CF8] text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border-none"
        >
          <CheckSquare className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="font-medium text-sm sm:text-base">Tasks</span>
        </Button>
      </Link>

      <Link to="/notes" className="no-underline hover:no-underline">
        <Button
          variant="outline"
          className="w-full h-20 sm:h-24 flex flex-col items-center justify-center gap-2 bg-[#EC4899] hover:bg-gradient-to-br hover:from-[#EC4899] hover:to-[#F472B6] text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border-none"
        >
          <StickyNote className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="font-medium text-sm sm:text-base">Notes</span>
        </Button>
      </Link>

      <Link to="/suggested-services" className="no-underline hover:no-underline">
        <Button
          variant="outline"
          className="w-full h-20 sm:h-24 flex flex-col items-center justify-center gap-2 bg-[#14B8A6] hover:bg-gradient-to-br hover:from-[#14B8A6] hover:to-[#2DD4BF] text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border-none"
        >
          <Package className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="font-medium text-sm sm:text-base">Services</span>
        </Button>
      </Link>
    </div>
  );
};

export default FeatureGrid;