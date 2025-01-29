import { Home, Search, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const Navigation = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border">
      <div className="container mx-auto px-4">
        <div className="flex justify-around items-center h-16">
          <Link
            to="/"
            className={`flex flex-col items-center space-y-1 transition-colors ${
              isActive("/")
                ? "text-primary"
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            <Home className="h-6 w-6" />
            <span className="text-xs">Home</span>
          </Link>
          <Link
            to="/search"
            className={`flex flex-col items-center space-y-1 transition-colors ${
              isActive("/search")
                ? "text-primary"
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            <Search className="h-6 w-6" />
            <span className="text-xs">Search</span>
          </Link>
          <Link
            to="/profile"
            className={`flex flex-col items-center space-y-1 transition-colors ${
              isActive("/profile")
                ? "text-primary"
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            <User className="h-6 w-6" />
            <span className="text-xs">Profile</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;