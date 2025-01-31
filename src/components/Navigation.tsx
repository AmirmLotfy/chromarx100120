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
      className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-primary/10 py-2 px-2 z-50 md:relative md:border-t-0 transition-all duration-200 ease-in-out"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container mx-auto flex justify-between items-center max-w-7xl gap-2">
        <Link 
          to="/" 
          className="flex-1"
          aria-label="Home"
          aria-current={isActive("/") ? "page" : undefined}
        >
          <Button
            variant={isActive("/") ? "default" : "ghost"}
            size="icon"
            className={`w-full h-14 md:h-12 flex items-center justify-center transition-all duration-200 
              ${isActive("/") ? "bg-primary/90 shadow-sm" : "hover:bg-primary/5"}`}
          >
            <Home className={`h-6 w-6 ${isActive("/") ? "text-primary-foreground" : "text-foreground"}`} />
          </Button>
        </Link>

        <Link 
          to="/bookmarks" 
          className="flex-1"
          aria-label="Bookmarks"
          aria-current={isActive("/bookmarks") ? "page" : undefined}
        >
          <Button
            variant={isActive("/bookmarks") ? "default" : "ghost"}
            size="icon"
            className={`w-full h-14 md:h-12 flex items-center justify-center transition-all duration-200 
              ${isActive("/bookmarks") ? "bg-primary/90 shadow-sm" : "hover:bg-primary/5"}`}
          >
            <BookmarkIcon className={`h-6 w-6 ${isActive("/bookmarks") ? "text-primary-foreground" : "text-foreground"}`} />
          </Button>
        </Link>

        <Link 
          to="/settings" 
          className="flex-1"
          aria-label="Settings"
          aria-current={isActive("/settings") ? "page" : undefined}
        >
          <Button
            variant={isActive("/settings") ? "default" : "ghost"}
            size="icon"
            className={`w-full h-14 md:h-12 flex items-center justify-center transition-all duration-200 
              ${isActive("/settings") ? "bg-primary/90 shadow-sm" : "hover:bg-primary/5"}`}
          >
            <Settings className={`h-6 w-6 ${isActive("/settings") ? "text-primary-foreground" : "text-foreground"}`} />
          </Button>
        </Link>
      </div>
    </nav>
  );
};

export default Navigation;