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
    <div className="mx-auto grid w-full max-w-4xl grid-cols-2 gap-3 px-3 py-3 sm:grid-cols-2 sm:px-4">
      <Link to="/bookmarks" className="no-underline hover:no-underline">
        <Button
          variant="outline"
          className="group h-28 w-full rounded-2xl border-2 border-primary/10 bg-primary/5 transition-all duration-200 hover:border-primary/20 hover:bg-primary/10 sm:h-36"
        >
          <div className="flex flex-col items-center justify-center gap-3">
            <BookmarkIcon className="h-8 w-8 transition-transform duration-200 group-hover:scale-110 sm:h-12 sm:w-12" />
            <span className="font-medium tracking-wide">Bookmarks</span>
          </div>
        </Button>
      </Link>
      
      <Link to="/chat" className="no-underline hover:no-underline">
        <Button
          variant="outline"
          className="group h-28 w-full rounded-2xl border-2 border-primary/10 bg-primary/5 transition-all duration-200 hover:border-primary/20 hover:bg-primary/10 sm:h-36"
        >
          <div className="flex flex-col items-center justify-center gap-3">
            <MessageSquare className="h-8 w-8 transition-transform duration-200 group-hover:scale-110 sm:h-12 sm:w-12" />
            <span className="font-medium tracking-wide">Chat</span>
          </div>
        </Button>
      </Link>

      <Link to="/summaries" className="no-underline hover:no-underline">
        <Button
          variant="outline"
          className="group h-28 w-full rounded-2xl border-2 border-primary/10 bg-primary/5 transition-all duration-200 hover:border-primary/20 hover:bg-primary/10 sm:h-36"
        >
          <div className="flex flex-col items-center justify-center gap-3">
            <FileText className="h-8 w-8 transition-transform duration-200 group-hover:scale-110 sm:h-12 sm:w-12" />
            <span className="font-medium tracking-wide">Summaries</span>
          </div>
        </Button>
      </Link>

      <Link to="/analytics" className="no-underline hover:no-underline">
        <Button
          variant="outline"
          className="group h-28 w-full rounded-2xl border-2 border-primary/10 bg-primary/5 transition-all duration-200 hover:border-primary/20 hover:bg-primary/10 sm:h-36"
        >
          <div className="flex flex-col items-center justify-center gap-3">
            <BarChart className="h-8 w-8 transition-transform duration-200 group-hover:scale-110 sm:h-12 sm:w-12" />
            <span className="font-medium tracking-wide">Analytics</span>
          </div>
        </Button>
      </Link>

      <Link to="/timer" className="no-underline hover:no-underline">
        <Button
          variant="outline"
          className="group h-28 w-full rounded-2xl border-2 border-primary/10 bg-primary/5 transition-all duration-200 hover:border-primary/20 hover:bg-primary/10 sm:h-36"
        >
          <div className="flex flex-col items-center justify-center gap-3">
            <Timer className="h-8 w-8 transition-transform duration-200 group-hover:scale-110 sm:h-12 sm:w-12" />
            <span className="font-medium tracking-wide">Timer</span>
          </div>
        </Button>
      </Link>

      <Link to="/tasks" className="no-underline hover:no-underline">
        <Button
          variant="outline"
          className="group h-28 w-full rounded-2xl border-2 border-primary/10 bg-primary/5 transition-all duration-200 hover:border-primary/20 hover:bg-primary/10 sm:h-36"
        >
          <div className="flex flex-col items-center justify-center gap-3">
            <CheckSquare className="h-8 w-8 transition-transform duration-200 group-hover:scale-110 sm:h-12 sm:w-12" />
            <span className="font-medium tracking-wide">Tasks</span>
          </div>
        </Button>
      </Link>

      <Link to="/notes" className="no-underline hover:no-underline">
        <Button
          variant="outline"
          className="group h-28 w-full rounded-2xl border-2 border-primary/10 bg-primary/5 transition-all duration-200 hover:border-primary/20 hover:bg-primary/10 sm:h-36"
        >
          <div className="flex flex-col items-center justify-center gap-3">
            <StickyNote className="h-8 w-8 transition-transform duration-200 group-hover:scale-110 sm:h-12 sm:w-12" />
            <span className="font-medium tracking-wide">Notes</span>
          </div>
        </Button>
      </Link>

      <Link to="/suggested-services" className="no-underline hover:no-underline">
        <Button
          variant="outline"
          className="group h-28 w-full rounded-2xl border-2 border-primary/10 bg-primary/5 transition-all duration-200 hover:border-primary/20 hover:bg-primary/10 sm:h-36"
        >
          <div className="flex flex-col items-center justify-center gap-3">
            <Package className="h-8 w-8 transition-transform duration-200 group-hover:scale-110 sm:h-12 sm:w-12" />
            <span className="font-medium tracking-wide">Services</span>
          </div>
        </Button>
      </Link>
    </div>
  );
};

export default FeatureGrid;