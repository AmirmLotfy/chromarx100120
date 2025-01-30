import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Home,
  BookmarkIcon,
  Settings,
  MessageSquare,
  Clock,
  FileText
} from "lucide-react";

const Navigation = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t py-2 px-4 md:px-8 z-50 md:relative md:border-t-0">
      <div className="container mx-auto flex justify-between items-center max-w-7xl">
        <Link to="/" className="flex-1 flex justify-center">
          <Button
            variant={isActive("/") ? "default" : "ghost"}
            size="icon"
            className="h-12 w-12 md:h-10 md:w-10"
          >
            <Home className="h-5 w-5" />
            <span className="sr-only">Home</span>
          </Button>
        </Link>

        <Link to="/bookmarks" className="flex-1 flex justify-center">
          <Button
            variant={isActive("/bookmarks") ? "default" : "ghost"}
            size="icon"
            className="h-12 w-12 md:h-10 md:w-10"
          >
            <BookmarkIcon className="h-5 w-5" />
            <span className="sr-only">Bookmarks</span>
          </Button>
        </Link>

        <Link to="/chat" className="flex-1 flex justify-center">
          <Button
            variant={isActive("/chat") ? "default" : "ghost"}
            size="icon"
            className="h-12 w-12 md:h-10 md:w-10"
          >
            <MessageSquare className="h-5 w-5" />
            <span className="sr-only">Chat</span>
          </Button>
        </Link>

        <Link to="/timer" className="flex-1 flex justify-center">
          <Button
            variant={isActive("/timer") ? "default" : "ghost"}
            size="icon"
            className="h-12 w-12 md:h-10 md:w-10"
          >
            <Clock className="h-5 w-5" />
            <span className="sr-only">Timer</span>
          </Button>
        </Link>

        <Link to="/notes" className="flex-1 flex justify-center">
          <Button
            variant={isActive("/notes") ? "default" : "ghost"}
            size="icon"
            className="h-12 w-12 md:h-10 md:w-10"
          >
            <FileText className="h-5 w-5" />
            <span className="sr-only">Notes</span>
          </Button>
        </Link>

        <Link to="/settings" className="flex-1 flex justify-center">
          <Button
            variant={isActive("/settings") ? "default" : "ghost"}
            size="icon"
            className="h-12 w-12 md:h-10 md:w-10"
          >
            <Settings className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </Button>
        </Link>
      </div>
    </nav>
  );
};

export default Navigation;