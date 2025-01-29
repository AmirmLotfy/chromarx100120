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
    <div className="grid grid-cols-2 gap-4">
      <Link to="/bookmarks" className="no-underline">
        <Button
          variant="outline"
          className="w-full h-32 flex flex-col items-center justify-center gap-2 bg-[#0EA5E9] hover:bg-gradient-to-br hover:from-[#0EA5E9] hover:to-[#38BDF8] text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
        >
          <BookmarkIcon className="h-8 w-8" />
          <span className="font-medium">Bookmarks</span>
        </Button>
      </Link>
      
      <Link to="/chat" className="no-underline">
        <Button
          variant="outline"
          className="w-full h-32 flex flex-col items-center justify-center gap-2 bg-[#8B5CF6] hover:bg-gradient-to-br hover:from-[#8B5CF6] hover:to-[#A78BFA] text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
        >
          <MessageSquare className="h-8 w-8" />
          <span className="font-medium">Chat</span>
        </Button>
      </Link>

      <Link to="/summaries" className="no-underline">
        <Button
          variant="outline"
          className="w-full h-32 flex flex-col items-center justify-center gap-2 bg-[#D946EF] hover:bg-gradient-to-br hover:from-[#D946EF] hover:to-[#E879F9] text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
        >
          <FileText className="h-8 w-8" />
          <span className="font-medium">Summaries</span>
        </Button>
      </Link>

      <Link to="/analytics" className="no-underline">
        <Button
          variant="outline"
          className="w-full h-32 flex flex-col items-center justify-center gap-2 bg-[#F97316] hover:bg-gradient-to-br hover:from-[#F97316] hover:to-[#FB923C] text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
        >
          <BarChart className="h-8 w-8" />
          <span className="font-medium">Analytics</span>
        </Button>
      </Link>

      <Link to="/timer" className="no-underline">
        <Button
          variant="outline"
          className="w-full h-32 flex flex-col items-center justify-center gap-2 bg-[#10B981] hover:bg-gradient-to-br hover:from-[#10B981] hover:to-[#34D399] text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
        >
          <Timer className="h-8 w-8" />
          <span className="font-medium">Timer</span>
        </Button>
      </Link>

      <Link to="/tasks" className="no-underline">
        <Button
          variant="outline"
          className="w-full h-32 flex flex-col items-center justify-center gap-2 bg-[#6366F1] hover:bg-gradient-to-br hover:from-[#6366F1] hover:to-[#818CF8] text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
        >
          <CheckSquare className="h-8 w-8" />
          <span className="font-medium">Tasks</span>
        </Button>
      </Link>

      <Link to="/notes" className="no-underline">
        <Button
          variant="outline"
          className="w-full h-32 flex flex-col items-center justify-center gap-2 bg-[#EC4899] hover:bg-gradient-to-br hover:from-[#EC4899] hover:to-[#F472B6] text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
        >
          <StickyNote className="h-8 w-8" />
          <span className="font-medium">Notes</span>
        </Button>
      </Link>

      <Link to="/suggested-services" className="no-underline">
        <Button
          variant="outline"
          className="w-full h-32 flex flex-col items-center justify-center gap-2 bg-[#14B8A6] hover:bg-gradient-to-br hover:from-[#14B8A6] hover:to-[#2DD4BF] text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
        >
          <Package className="h-8 w-8" />
          <span className="font-medium">Services</span>
        </Button>
      </Link>
    </div>
  );
};

export default FeatureGrid;