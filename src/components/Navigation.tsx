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
            variant={isActive("/") ? "default" : "ghost"}
            size="icon"
            className={`flex h-12 w-full flex-col items-center justify-center gap-1 rounded-xl transition-all md:h-10
              ${isActive("/") ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-accent-foreground"}`}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs font-medium">Home</span>
          </Button>
        </Link>

        <Link 
          to="/bookmarks" 
          className="flex flex-1 flex-col items-center"
          aria-label="Bookmarks"
          aria-current={isActive("/bookmarks") ? "page" : undefined}
        >
          <Button
            variant={isActive("/bookmarks") ? "default" : "ghost"}
            size="icon"
            className={`flex h-12 w-full flex-col items-center justify-center gap-1 rounded-xl transition-all md:h-10
              ${isActive("/bookmarks") ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-accent-foreground"}`}
          >
            <BookmarkIcon className="h-5 w-5" />
            <span className="text-xs font-medium">Bookmarks</span>
          </Button>
        </Link>

        <Link 
          to="/settings" 
          className="flex flex-1 flex-col items-center"
          aria-label="Settings"
          aria-current={isActive("/settings") ? "page" : undefined}
        >
          <Button
            variant={isActive("/settings") ? "default" : "ghost"}
            size="icon"
            className={`flex h-12 w-full flex-col items-center justify-center gap-1 rounded-xl transition-all md:h-10
              ${isActive("/settings") ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-accent-foreground"}`}
          >
            <Settings className="h-5 w-5" />
            <span className="text-xs font-medium">Settings</span>
          </Button>
        </Link>
      </div>
    </nav>
  );
};

export default Navigation;