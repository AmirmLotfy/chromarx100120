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
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-3 px-3 py-3 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:px-4 sm:gap-4 md:gap-5">
      <Link to="/bookmarks" className="no-underline hover:no-underline">
        <Button
          variant="outline"
          className="group h-24 w-full rounded-2xl border-2 border-primary/10 bg-primary/5 transition-all duration-200 hover:border-primary/20 hover:bg-primary/10 sm:h-32"
        >
          <div className="flex flex-col items-center justify-center gap-3">
            <BookmarkIcon className="h-6 w-6 transition-transform duration-200 group-hover:scale-110 sm:h-8 sm:w-8" />
            <span className="font-medium tracking-wide text-sm sm:text-base">Bookmarks</span>
          </div>
        </Button>
      </Link>
      
      <Link to="/chat" className="no-underline hover:no-underline">
        <Button
          variant="outline"
          className="group h-24 w-full rounded-2xl border-2 border-primary/10 bg-primary/5 transition-all duration-200 hover:border-primary/20 hover:bg-primary/10 sm:h-32"
        >
          <div className="flex flex-col items-center justify-center gap-3">
            <MessageSquare className="h-6 w-6 transition-transform duration-200 group-hover:scale-110 sm:h-8 sm:w-8" />
            <span className="font-medium tracking-wide text-sm sm:text-base">Chat</span>
          </div>
        </Button>
      </Link>

      <Link to="/summaries" className="no-underline hover:no-underline">
        <Button
          variant="outline"
          className="group h-24 w-full rounded-2xl border-2 border-primary/10 bg-primary/5 transition-all duration-200 hover:border-primary/20 hover:bg-primary/10 sm:h-32"
        >
          <div className="flex flex-col items-center justify-center gap-3">
            <FileText className="h-6 w-6 transition-transform duration-200 group-hover:scale-110 sm:h-8 sm:w-8" />
            <span className="font-medium tracking-wide text-sm sm:text-base">Summaries</span>
          </div>
        </Button>
      </Link>

      <Link to="/analytics" className="no-underline hover:no-underline">
        <Button
          variant="outline"
          className="group h-24 w-full rounded-2xl border-2 border-primary/10 bg-primary/5 transition-all duration-200 hover:border-primary/20 hover:bg-primary/10 sm:h-32"
        >
          <div className="flex flex-col items-center justify-center gap-3">
            <BarChart className="h-6 w-6 transition-transform duration-200 group-hover:scale-110 sm:h-8 sm:w-8" />
            <span className="font-medium tracking-wide text-sm sm:text-base">Analytics</span>
          </div>
        </Button>
      </Link>

      <Link to="/timer" className="no-underline hover:no-underline">
        <Button
          variant="outline"
          className="group h-24 w-full rounded-2xl border-2 border-primary/10 bg-primary/5 transition-all duration-200 hover:border-primary/20 hover:bg-primary/10 sm:h-32"
        >
          <div className="flex flex-col items-center justify-center gap-3">
            <Timer className="h-6 w-6 transition-transform duration-200 group-hover:scale-110 sm:h-8 sm:w-8" />
            <span className="font-medium tracking-wide text-sm sm:text-base">Timer</span>
          </div>
        </Button>
      </Link>

      <Link to="/tasks" className="no-underline hover:no-underline">
        <Button
          variant="outline"
          className="group h-24 w-full rounded-2xl border-2 border-primary/10 bg-primary/5 transition-all duration-200 hover:border-primary/20 hover:bg-primary/10 sm:h-32"
        >
          <div className="flex flex-col items-center justify-center gap-3">
            <CheckSquare className="h-6 w-6 transition-transform duration-200 group-hover:scale-110 sm:h-8 sm:w-8" />
            <span className="font-medium tracking-wide text-sm sm:text-base">Tasks</span>
          </div>
        </Button>
      </Link>

      <Link to="/notes" className="no-underline hover:no-underline">
        <Button
          variant="outline"
          className="group h-24 w-full rounded-2xl border-2 border-primary/10 bg-primary/5 transition-all duration-200 hover:border-primary/20 hover:bg-primary/10 sm:h-32"
        >
          <div className="flex flex-col items-center justify-center gap-3">
            <StickyNote className="h-6 w-6 transition-transform duration-200 group-hover:scale-110 sm:h-8 sm:w-8" />
            <span className="font-medium tracking-wide text-sm sm:text-base">Notes</span>
          </div>
        </Button>
      </Link>

      <Link to="/suggested-services" className="no-underline hover:no-underline">
        <Button
          variant="outline"
          className="group h-24 w-full rounded-2xl border-2 border-primary/10 bg-primary/5 transition-all duration-200 hover:border-primary/20 hover:bg-primary/10 sm:h-32"
        >
          <div className="flex flex-col items-center justify-center gap-3">
            <Package className="h-6 w-6 transition-transform duration-200 group-hover:scale-110 sm:h-8 sm:w-8" />
            <span className="font-medium tracking-wide text-sm sm:text-base">Services</span>
          </div>
        </Button>
      </Link>
    </div>
  );
};

export default FeatureGrid;