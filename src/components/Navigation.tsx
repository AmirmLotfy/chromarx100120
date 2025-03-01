
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, BookmarkIcon, Bell, UserRound } from "lucide-react";

const Navigation = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60 border-t border-border/40"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container h-full mx-auto max-w-md flex items-center justify-between px-6">
        <NavItem 
          to="/" 
          icon={<Home className="h-5 w-5" />}
          isActive={isActive("/")}
          label="Home"
        />
        <NavItem 
          to="/bookmarks" 
          icon={<BookmarkIcon className="h-5 w-5" />}
          isActive={isActive("/bookmarks")}
          label="Bookmarks"
        />
        <NavItem 
          to="/notifications" 
          icon={<Bell className="h-5 w-5" />}
          isActive={isActive("/notifications")}
          label="Notifications"
        />
        <NavItem 
          to="/user" 
          icon={<UserRound className="h-5 w-5" />}
          isActive={isActive("/user")}
          label="Profile"
        />
      </div>
    </nav>
  );
};

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  isActive: boolean;
  label: string;
}

const NavItem = ({ to, icon, isActive, label }: NavItemProps) => (
  <Link 
    to={to} 
    className="flex flex-col items-center"
    aria-label={label}
    aria-current={isActive ? "page" : undefined}
  >
    <Button
      variant="ghost"
      size="icon"
      className={`relative flex flex-col items-center justify-center rounded-full w-12 h-12 p-0
        ${isActive 
          ? "text-primary" 
          : "text-muted-foreground hover:text-foreground"
        }`}
    >
      {icon}
      {isActive && (
        <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-primary" />
      )}
    </Button>
  </Link>
);

export default Navigation;
