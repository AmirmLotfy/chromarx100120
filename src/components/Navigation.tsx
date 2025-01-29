import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Home,
  BookmarkIcon,
  Settings,
} from "lucide-react";

const Navigation = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t py-2 px-4 md:px-8">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/">
          <Button
            variant={isActive("/") ? "default" : "ghost"}
            size="icon"
          >
            <Home className="h-5 w-5" />
          </Button>
        </Link>

        <Link to="/bookmarks">
          <Button
            variant={isActive("/bookmarks") ? "default" : "ghost"}
            size="icon"
          >
            <BookmarkIcon className="h-5 w-5" />
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