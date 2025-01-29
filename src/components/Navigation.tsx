import { Link, useLocation } from "react-router-dom";
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
  Settings,
  CreditCard,
} from "lucide-react";

const Navigation = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t py-2 px-4 md:px-8">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/bookmarks">
          <Button
            variant={isActive("/bookmarks") ? "default" : "ghost"}
            size="icon"
          >
            <BookmarkIcon className="h-5 w-5" />
          </Button>
        </Link>

        <Link to="/chat">
          <Button variant={isActive("/chat") ? "default" : "ghost"} size="icon">
            <MessageSquare className="h-5 w-5" />
          </Button>
        </Link>

        <Link to="/summaries">
          <Button
            variant={isActive("/summaries") ? "default" : "ghost"}
            size="icon"
          >
            <FileText className="h-5 w-5" />
          </Button>
        </Link>

        <Link to="/search">
          <Button
            variant={isActive("/search") ? "default" : "ghost"}
            size="icon"
          >
            <Search className="h-5 w-5" />
          </Button>
        </Link>

        <Link to="/analytics">
          <Button
            variant={isActive("/analytics") ? "default" : "ghost"}
            size="icon"
          >
            <BarChart className="h-5 w-5" />
          </Button>
        </Link>

        <Link to="/timer">
          <Button
            variant={isActive("/timer") ? "default" : "ghost"}
            size="icon"
          >
            <Timer className="h-5 w-5" />
          </Button>
        </Link>

        <Link to="/tasks">
          <Button
            variant={isActive("/tasks") ? "default" : "ghost"}
            size="icon"
          >
            <CheckSquare className="h-5 w-5" />
          </Button>
        </Link>

        <Link to="/notes">
          <Button
            variant={isActive("/notes") ? "default" : "ghost"}
            size="icon"
          >
            <StickyNote className="h-5 w-5" />
          </Button>
        </Link>

        <Link to="/subscription">
          <Button
            variant={isActive("/subscription") ? "default" : "ghost"}
            size="icon"
          >
            <CreditCard className="h-5 w-5" />
          </Button>
        </Link>

        <Link to="/settings">
          <Button
            variant={isActive("/settings") ? "default" : "ghost"}
            size="icon"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    </nav>
  );
};

export default Navigation;