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
        <Button variant="outline" className="feature-button">
          <BookmarkIcon className="feature-icon" />
          <span className="feature-text">Bookmarks</span>
        </Button>
      </Link>
      
      <Link to="/chat" className="no-underline hover:no-underline">
        <Button variant="outline" className="feature-button">
          <MessageSquare className="feature-icon" />
          <span className="feature-text">Chat</span>
        </Button>
      </Link>

      <Link to="/summaries" className="no-underline hover:no-underline">
        <Button variant="outline" className="feature-button">
          <FileText className="feature-icon" />
          <span className="feature-text">Summaries</span>
        </Button>
      </Link>

      <Link to="/analytics" className="no-underline hover:no-underline">
        <Button variant="outline" className="feature-button">
          <BarChart className="feature-icon" />
          <span className="feature-text">Analytics</span>
        </Button>
      </Link>

      <Link to="/timer" className="no-underline hover:no-underline">
        <Button variant="outline" className="feature-button">
          <Timer className="feature-icon" />
          <span className="feature-text">Timer</span>
        </Button>
      </Link>

      <Link to="/tasks" className="no-underline hover:no-underline">
        <Button variant="outline" className="feature-button">
          <CheckSquare className="feature-icon" />
          <span className="feature-text">Tasks</span>
        </Button>
      </Link>

      <Link to="/notes" className="no-underline hover:no-underline">
        <Button variant="outline" className="feature-button">
          <StickyNote className="feature-icon" />
          <span className="feature-text">Notes</span>
        </Button>
      </Link>

      <Link to="/suggested-services" className="no-underline hover:no-underline">
        <Button variant="outline" className="feature-button">
          <Package className="feature-icon" />
          <span className="feature-text">Services</span>
        </Button>
      </Link>
    </div>
  );
};

export default FeatureGrid;