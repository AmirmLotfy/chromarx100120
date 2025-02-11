
import { Link, useLocation } from "react-router-dom";
import { Home, BookmarkIcon, Settings } from "lucide-react";
import { ButtonCta } from "@/components/ui/button-shiny";
import { cn } from "@/lib/utils";

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
    <ButtonCta
      className={cn(
        "w-14 h-14 p-0",
        isActive ? "opacity-100" : "opacity-80 hover:opacity-100"
      )}
    >
      <div className="flex flex-col items-center justify-center gap-1">
        {icon}
        <span className="text-[10px] font-medium mt-0.5">
          {label}
        </span>
      </div>
    </ButtonCta>
  </Link>
);

export default Navigation;
