import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  BookmarkIcon,
  MessageSquare,
  FileText,
  Search,
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
    </div>
  );
};

export default FeatureGrid;