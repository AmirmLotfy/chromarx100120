import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  BookmarkIcon,
  MessageSquare,
  FileText,
  Search,
  BarChart,
  Timer,
  CheckSquare,
  StickyNote,
  Package,
} from "lucide-react";

const FeatureGrid = () => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Link to="/bookmarks">
        <Button
          variant="outline"
          className="w-full h-24 flex flex-col items-center justify-center gap-2"
        >
          <BookmarkIcon className="h-6 w-6" />
          <span>Bookmarks</span>
        </Button>
      </Link>
      
      <Link to="/chat">
        <Button
          variant="outline"
          className="w-full h-24 flex flex-col items-center justify-center gap-2 bg-primary/5 hover:bg-primary/10"
        >
          <MessageSquare className="h-6 w-6" />
          <span>Chat</span>
        </Button>
      </Link>

      <Link to="/summaries">
        <Button
          variant="outline"
          className="w-full h-24 flex flex-col items-center justify-center gap-2"
        >
          <FileText className="h-6 w-6" />
          <span>Summaries</span>
        </Button>
      </Link>

      <Link to="/search">
        <Button
          variant="outline"
          className="w-full h-24 flex flex-col items-center justify-center gap-2"
        >
          <Search className="h-6 w-6" />
          <span>Search</span>
        </Button>
      </Link>

      <Link to="/analytics">
        <Button
          variant="outline"
          className="w-full h-24 flex flex-col items-center justify-center gap-2"
        >
          <BarChart className="h-6 w-6" />
          <span>Analytics</span>
        </Button>
      </Link>

      <Link to="/timer">
        <Button
          variant="outline"
          className="w-full h-24 flex flex-col items-center justify-center gap-2"
        >
          <Timer className="h-6 w-6" />
          <span>Timer</span>
        </Button>
      </Link>

      <Link to="/tasks">
        <Button
          variant="outline"
          className="w-full h-24 flex flex-col items-center justify-center gap-2"
        >
          <CheckSquare className="h-6 w-6" />
          <span>Tasks</span>
        </Button>
      </Link>

      <Link to="/notes">
        <Button
          variant="outline"
          className="w-full h-24 flex flex-col items-center justify-center gap-2"
        >
          <StickyNote className="h-6 w-6" />
          <span>Notes</span>
        </Button>
      </Link>

      <Link to="/suggested-services">
        <Button
          variant="outline"
          className="w-full h-24 flex flex-col items-center justify-center gap-2 bg-accent hover:bg-accent/80"
        >
          <Package className="h-6 w-6" />
          <span>Suggested Services</span>
        </Button>
      </Link>
    </div>
  );
};

export default FeatureGrid;