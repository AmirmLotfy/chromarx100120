
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, BookmarkIcon, Settings } from "lucide-react";

const Navigation = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60 shadow-sm"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container h-full mx-auto max-w-screen-xl flex items-center justify-around px-4">
        <NavItem 
          to="/" 
          icon={<Home className="h-[22px] w-[22px]" />}
          label="Home"
          isActive={isActive("/")}
        />
        <NavItem 
          to="/bookmarks" 
          icon={<BookmarkIcon className="h-[22px] w-[22px]" />}
          label="Bookmarks"
          isActive={isActive("/bookmarks")}
        />
        <NavItem 
          to="/settings" 
          icon={<Settings className="h-[22px] w-[22px]" />}
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
      variant="ghost"
      size="icon"
      className={`flex h-14 w-14 flex-col items-center justify-center gap-1 rounded-2xl transition-all duration-200
        ${isActive 
          ? "text-primary bg-primary/10" 
          : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
        }`}
    >
      {icon}
      <span className="text-[10px] font-medium mt-0.5">{label}</span>
    </Button>
  </Link>
);

export default Navigation;
