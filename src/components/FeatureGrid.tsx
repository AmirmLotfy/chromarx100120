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
    <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4 px-2 sm:px-6 max-w-4xl mx-auto w-full py-4">
      <Link to="/bookmarks" className="no-underline hover:no-underline w-full">
        <Button
          variant="outline"
          className="w-full h-32 sm:h-40 flex flex-col items-center justify-center gap-4 bg-[#9b87f5] hover:bg-gradient-to-br hover:from-[#9b87f5] hover:to-[#D6BCFA] text-white transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl border-none rounded-xl"
        >
          <BookmarkIcon className="h-8 w-8 sm:h-10 sm:w-10" />
          <span className="font-semibold text-base sm:text-lg tracking-wide">Bookmarks</span>
        </Button>
      </Link>
      
      <Link to="/chat" className="no-underline hover:no-underline w-full">
        <Button
          variant="outline"
          className="w-full h-32 sm:h-40 flex flex-col items-center justify-center gap-4 bg-[#7E69AB] hover:bg-gradient-to-br hover:from-[#7E69AB] hover:to-[#9b87f5] text-white transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl border-none rounded-xl"
        >
          <MessageSquare className="h-8 w-8 sm:h-10 sm:w-10" />
          <span className="font-semibold text-base sm:text-lg tracking-wide">Chat</span>
        </Button>
      </Link>

      <Link to="/summaries" className="no-underline hover:no-underline w-full">
        <Button
          variant="outline"
          className="w-full h-32 sm:h-40 flex flex-col items-center justify-center gap-4 bg-[#D946EF] hover:bg-gradient-to-br hover:from-[#D946EF] hover:to-[#E879F9] text-white transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl border-none rounded-xl"
        >
          <FileText className="h-8 w-8 sm:h-10 sm:w-10" />
          <span className="font-semibold text-base sm:text-lg tracking-wide">Summaries</span>
        </Button>
      </Link>

      <Link to="/analytics" className="no-underline hover:no-underline w-full">
        <Button
          variant="outline"
          className="w-full h-32 sm:h-40 flex flex-col items-center justify-center gap-4 bg-[#F97316] hover:bg-gradient-to-br hover:from-[#F97316] hover:to-[#FB923C] text-white transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl border-none rounded-xl"
        >
          <BarChart className="h-8 w-8 sm:h-10 sm:w-10" />
          <span className="font-semibold text-base sm:text-lg tracking-wide">Analytics</span>
        </Button>
      </Link>

      <Link to="/timer" className="no-underline hover:no-underline w-full">
        <Button
          variant="outline"
          className="w-full h-32 sm:h-40 flex flex-col items-center justify-center gap-4 bg-[#10B981] hover:bg-gradient-to-br hover:from-[#10B981] hover:to-[#34D399] text-white transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl border-none rounded-xl"
        >
          <Timer className="h-8 w-8 sm:h-10 sm:w-10" />
          <span className="font-semibold text-base sm:text-lg tracking-wide">Timer</span>
        </Button>
      </Link>

      <Link to="/tasks" className="no-underline hover:no-underline w-full">
        <Button
          variant="outline"
          className="w-full h-32 sm:h-40 flex flex-col items-center justify-center gap-4 bg-[#6366F1] hover:bg-gradient-to-br hover:from-[#6366F1] hover:to-[#818CF8] text-white transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl border-none rounded-xl"
        >
          <CheckSquare className="h-8 w-8 sm:h-10 sm:w-10" />
          <span className="font-semibold text-base sm:text-lg tracking-wide">Tasks</span>
        </Button>
      </Link>

      <Link to="/notes" className="no-underline hover:no-underline w-full">
        <Button
          variant="outline"
          className="w-full h-32 sm:h-40 flex flex-col items-center justify-center gap-4 bg-[#EC4899] hover:bg-gradient-to-br hover:from-[#EC4899] hover:to-[#F472B6] text-white transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl border-none rounded-xl"
        >
          <StickyNote className="h-8 w-8 sm:h-10 sm:w-10" />
          <span className="font-semibold text-base sm:text-lg tracking-wide">Notes</span>
        </Button>
      </Link>

      <Link to="/suggested-services" className="no-underline hover:no-underline w-full">
        <Button
          variant="outline"
          className="w-full h-32 sm:h-40 flex flex-col items-center justify-center gap-4 bg-[#14B8A6] hover:bg-gradient-to-br hover:from-[#14B8A6] hover:to-[#2DD4BF] text-white transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl border-none rounded-xl"
        >
          <Package className="h-8 w-8 sm:h-10 sm:w-10" />
          <span className="font-semibold text-base sm:text-lg tracking-wide">Services</span>
        </Button>
      </Link>
    </div>
  );
};

export default FeatureGrid;