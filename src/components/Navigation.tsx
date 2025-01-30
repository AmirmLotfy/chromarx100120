import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, BookmarkIcon, Settings } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const Navigation = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-background border-t py-2 px-4 md:px-8 z-50 md:relative md:border-t-0 transition-all duration-200 ease-in-out"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container mx-auto flex justify-around items-center max-w-7xl">
        <Link 
          to="/" 
          className="flex-1 flex justify-center"
          aria-label="Home"
          aria-current={isActive("/") ? "page" : undefined}
        >
          <Button
            variant={isActive("/") ? "default" : "ghost"}
            size="icon"
            className="h-14 w-14 md:h-10 md:w-10 flex flex-col items-center justify-center gap-1 transition-colors duration-200"
          >
            <Home className="h-5 w-5" />
            <span className="text-xs font-medium md:sr-only">Home</span>
          </Button>
        </Link>

        <Link 
          to="/bookmarks" 
          className="flex-1 flex justify-center"
          aria-label="Bookmarks"
          aria-current={isActive("/bookmarks") ? "page" : undefined}
        >
          <Button
            variant={isActive("/bookmarks") ? "default" : "ghost"}
            size="icon"
            className="h-14 w-14 md:h-10 md:w-10 flex flex-col items-center justify-center gap-1 transition-colors duration-200"
          >
            <BookmarkIcon className="h-5 w-5" />
            <span className="text-xs font-medium md:sr-only">Bookmarks</span>
          </Button>
        </Link>

        <Link 
          to="/settings" 
          className="flex-1 flex justify-center"
          aria-label="Settings"
          aria-current={isActive("/settings") ? "page" : undefined}
        >
          <Button
            variant={isActive("/settings") ? "default" : "ghost"}
            size="icon"
            className="h-14 w-14 md:h-10 md:w-10 flex flex-col items-center justify-center gap-1 transition-colors duration-200"
          >
            <Settings className="h-5 w-5" />
            <span className="text-xs font-medium md:sr-only">Settings</span>
          </Button>
        </Link>
      </div>
    </nav>
  );
};

export default Navigation;