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
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t py-4 px-4 md:px-8">
      <div className="container mx-auto">
        <div className="grid grid-cols-2 gap-4 md:flex md:justify-between md:items-center">
          <Link to="/" className="w-full">
            <Button
              variant={isActive("/") ? "default" : "ghost"}
              size="lg"
              className="w-full h-24 md:h-10 flex flex-col md:flex-row items-center justify-center gap-2 bg-[#8B5CF6] hover:bg-[#7C3AED]"
            >
              <Home className="h-6 w-6 md:h-5 md:w-5" />
              <span className="text-sm">Home</span>
            </Button>
          </Link>

          <Link to="/bookmarks" className="w-full">
            <Button
              variant={isActive("/bookmarks") ? "default" : "ghost"}
              size="lg"
              className="w-full h-24 md:h-10 flex flex-col md:flex-row items-center justify-center gap-2 bg-[#0EA5E9] hover:bg-[#0284C7]"
            >
              <BookmarkIcon className="h-6 w-6 md:h-5 md:w-5" />
              <span className="text-sm">Bookmarks</span>
            </Button>
          </Link>

          <Link to="/settings" className="w-full">
            <Button
              variant={isActive("/settings") ? "default" : "ghost"}
              size="lg"
              className="w-full h-24 md:h-10 flex flex-col md:flex-row items-center justify-center gap-2 bg-[#D946EF] hover:bg-[#C026D3]"
            >
              <Settings className="h-6 w-6 md:h-5 md:w-5" />
              <span className="text-sm">Settings</span>
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;