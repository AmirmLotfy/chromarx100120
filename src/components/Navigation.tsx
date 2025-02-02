import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, BookmarkIcon, Settings } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const Navigation = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const isActive = (path: string) => location.pathname === path;

  if (!isMobile) return null;

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container h-full mx-auto max-w-screen-xl flex items-center justify-around px-4">
        <NavItem 
          to="/" 
          icon={<Home className="h-5 w-5" />}
          label="Home"
          isActive={isActive("/")}
        />
        <NavItem 
          to="/bookmarks" 
          icon={<BookmarkIcon className="h-5 w-5" />}
          label="Bookmarks"
          isActive={isActive("/bookmarks")}
        />
        <NavItem 
          to="/settings" 
          icon={<Settings className="h-5 w-5" />}
          label="Settings"
          isActive={isActive("/settings")}
        />
      </div>
    </nav>
  );
};

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

const NavItem = ({ to, icon, label, isActive }: NavItemProps) => (
  <Link 
    to={to} 
    className="flex-1 flex flex-col items-center"
    aria-label={label}
    aria-current={isActive ? "page" : undefined}
  >
    <Button
      variant={isActive ? "default" : "ghost"}
      size="icon"
      className={`flex h-12 w-full flex-col items-center justify-center gap-1 rounded-xl transition-all
        ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-accent-foreground"}`}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </Button>
  </Link>
);

export default Navigation;