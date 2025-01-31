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
      className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-primary/20 py-3 px-4 md:px-8 z-50 md:relative md:border-t-0 transition-all duration-200 ease-in-out"
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
            className={`h-16 w-16 md:h-12 md:w-12 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 
              ${isActive("/") ? "bg-primary shadow-lg shadow-primary/25" : "hover:bg-primary/10"}`}
          >
            <Home className={`h-6 w-6 ${isActive("/") ? "text-primary-foreground" : "text-foreground"}`} />
            <span className={`text-xs font-medium md:sr-only ${isActive("/") ? "text-primary-foreground" : "text-foreground"}`}>
              Home
            </span>
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
            className={`h-16 w-16 md:h-12 md:w-12 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 
              ${isActive("/bookmarks") ? "bg-primary shadow-lg shadow-primary/25" : "hover:bg-primary/10"}`}
          >
            <BookmarkIcon className={`h-6 w-6 ${isActive("/bookmarks") ? "text-primary-foreground" : "text-foreground"}`} />
            <span className={`text-xs font-medium md:sr-only ${isActive("/bookmarks") ? "text-primary-foreground" : "text-foreground"}`}>
              Bookmarks
            </span>
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
            className={`h-16 w-16 md:h-12 md:w-12 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 
              ${isActive("/settings") ? "bg-primary shadow-lg shadow-primary/25" : "hover:bg-primary/10"}`}
          >
            <Settings className={`h-6 w-6 ${isActive("/settings") ? "text-primary-foreground" : "text-foreground"}`} />
            <span className={`text-xs font-medium md:sr-only ${isActive("/settings") ? "text-primary-foreground" : "text-foreground"}`}>
              Settings
            </span>
          </Button>
        </Link>
      </div>
    </nav>
  );
};

export default Navigation;