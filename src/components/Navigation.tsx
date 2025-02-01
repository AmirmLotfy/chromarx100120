import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, BookmarkIcon, Settings } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:relative md:border-t-0"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container mx-auto flex max-w-screen-xl items-center justify-around py-2">
        <Link 
          to="/" 
          className="flex flex-1 flex-col items-center"
          aria-label="Home"
          aria-current={isActive("/") ? "page" : undefined}
        >
          <Button
            variant="ghost"
            className={cn(
              "nav-button",
              isActive("/") && "nav-button-active"
            )}
          >
            <Home className="nav-icon" />
            <span className="nav-text">Home</span>
          </Button>
        </Link>

        <Link 
          to="/bookmarks" 
          className="flex flex-1 flex-col items-center"
          aria-label="Bookmarks"
          aria-current={isActive("/bookmarks") ? "page" : undefined}
        >
          <Button
            variant="ghost"
            className={cn(
              "nav-button",
              isActive("/bookmarks") && "nav-button-active"
            )}
          >
            <BookmarkIcon className="nav-icon" />
            <span className="nav-text">Bookmarks</span>
          </Button>
        </Link>

        <Link 
          to="/settings" 
          className="flex flex-1 flex-col items-center"
          aria-label="Settings"
          aria-current={isActive("/settings") ? "page" : undefined}
        >
          <Button
            variant="ghost"
            className={cn(
              "nav-button",
              isActive("/settings") && "nav-button-active"
            )}
          >
            <Settings className="nav-icon" />
            <span className="nav-text">Settings</span>
          </Button>
        </Link>
      </div>
    </nav>
  );
};

export default Navigation;