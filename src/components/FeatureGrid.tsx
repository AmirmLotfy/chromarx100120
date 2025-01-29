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
      <Link to="/bookmarks">
        <Button
          variant="outline"
          className="w-full h-32 flex flex-col items-center justify-center gap-2 bg-[#0EA5E9] hover:bg-[#0EA5E9]/90 text-white"
        >
          <BookmarkIcon className="h-8 w-8" />
          <span className="font-medium">Bookmarks</span>
        </Button>
      </Link>
      
      <Link to="/chat">
        <Button
          variant="outline"
          className="w-full h-32 flex flex-col items-center justify-center gap-2 bg-[#8B5CF6] hover:bg-[#8B5CF6]/90 text-white"
        >
          <MessageSquare className="h-8 w-8" />
          <span className="font-medium">Chat</span>
        </Button>
      </Link>

      <Link to="/summaries">
        <Button
          variant="outline"
          className="w-full h-32 flex flex-col items-center justify-center gap-2 bg-[#D946EF] hover:bg-[#D946EF]/90 text-white"
        >
          <FileText className="h-8 w-8" />
          <span className="font-medium">Summaries</span>
        </Button>
      </Link>

      <Link to="/analytics">
        <Button
          variant="outline"
          className="w-full h-32 flex flex-col items-center justify-center gap-2 bg-[#F97316] hover:bg-[#F97316]/90 text-white"
        >
          <BarChart className="h-8 w-8" />
          <span className="font-medium">Analytics</span>
        </Button>
      </Link>

      <Link to="/timer">
        <Button
          variant="outline"
          className="w-full h-32 flex flex-col items-center justify-center gap-2 bg-[#10B981] hover:bg-[#10B981]/90 text-white"
        >
          <Timer className="h-8 w-8" />
          <span className="font-medium">Timer</span>
        </Button>
      </Link>

      <Link to="/tasks">
        <Button
          variant="outline"
          className="w-full h-32 flex flex-col items-center justify-center gap-2 bg-[#6366F1] hover:bg-[#6366F1]/90 text-white"
        >
          <CheckSquare className="h-8 w-8" />
          <span className="font-medium">Tasks</span>
        </Button>
      </Link>

      <Link to="/notes">
        <Button
          variant="outline"
          className="w-full h-32 flex flex-col items-center justify-center gap-2 bg-[#EC4899] hover:bg-[#EC4899]/90 text-white"
        >
          <StickyNote className="h-8 w-8" />
          <span className="font-medium">Notes</span>
        </Button>
      </Link>

      <Link to="/suggested-services">
        <Button
          variant="outline"
          className="w-full h-32 flex flex-col items-center justify-center gap-2 bg-[#14B8A6] hover:bg-[#14B8A6]/90 text-white"
        >
          <Package className="h-8 w-8" />
          <span className="font-medium">Services</span>
        </Button>
      </Link>
    </div>
  );
};

export default FeatureGrid;