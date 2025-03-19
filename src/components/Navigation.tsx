
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Bookmark, User, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useEffect } from "react";

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Make sure current path is tracked correctly
  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Handle navigation with proper event prevention
  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, to: string) => {
    e.preventDefault();
    navigate(to);
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-40 h-16 px-2 py-2 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 border-t border-border/40"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container h-full mx-auto max-w-md">
        <div className="relative bg-muted backdrop-blur-sm rounded-2xl h-full px-2 flex items-center justify-around shadow-sm border border-border/20">
          <NavItem 
            to="/" 
            icon={<Home className="h-5 w-5" />}
            isActive={isActive("/")}
            label="Home"
            onClick={handleNavigation}
          />
          <NavItem 
            to="/bookmarks" 
            icon={<Bookmark className="h-5 w-5" />}
            isActive={isActive("/bookmarks")}
            label="Bookmarks"
            onClick={handleNavigation}
          />
          <NavItem 
            to="/timer" 
            icon={<Clock className="h-5 w-5" />}
            isActive={isActive("/timer")}
            label="Timer"
            onClick={handleNavigation}
          />
          <NavItem 
            to="/user" 
            icon={<User className="h-5 w-5" />}
            isActive={isActive("/user")}
            label="Profile"
            onClick={handleNavigation}
          />
          
          {/* Active indicator pill */}
          <ActiveIndicator location={location.pathname} />
        </div>
      </div>
    </nav>
  );
};

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  isActive: boolean;
  label: string;
  onClick: (e: React.MouseEvent<HTMLAnchorElement>, to: string) => void;
}

const NavItem = ({ to, icon, isActive, label, onClick }: NavItemProps) => (
  <Link 
    to={to} 
    className={cn(
      "relative flex flex-col items-center justify-center w-16 h-full z-10",
      isActive ? "text-primary" : "text-muted-foreground"
    )}
    aria-label={label}
    aria-current={isActive ? "page" : undefined}
    onClick={(e) => onClick(e, to)}
  >
    <div className="flex flex-col items-center justify-center gap-1">
      {icon}
      <span className="text-[10px] font-medium opacity-90">{label}</span>
    </div>
  </Link>
);

// Active tab indicator with animation
const ActiveIndicator = ({ location }: { location: string }) => {
  // Map routes to positions (0-based index)
  const getPosition = (path: string) => {
    switch (path) {
      case "/": return 0;
      case "/bookmarks": return 1;
      case "/timer": return 2;
      case "/user": return 3;
      default: 
        // Try to match the first part of the path
        if (path.startsWith("/bookmarks")) return 1;
        if (path.startsWith("/timer")) return 2;
        if (path.startsWith("/user")) return 3;
        return 0; // Default to home
    }
  };

  const position = getPosition(location);

  return (
    <motion.div
      className="absolute top-0 left-0 w-16 h-full bg-primary/10 rounded-2xl"
      initial={false}
      animate={{ 
        x: position * 64, // 64px is approximate width of each nav item (w-16)
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30
      }}
    />
  );
};

export default Navigation;
