import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFirebase } from "@/contexts/FirebaseContext";
import { auth } from "@/lib/firebase";

const Header = () => {
  const { user } = useFirebase();

  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <img 
              src="/lovable-uploads/b4b481d2-8bb9-44fd-adee-0a0b27cb341c.png" 
              alt="ChroMarx" 
              className="h-10" 
            />
          </Link>
        </div>
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium ml-8">
          <Link to="/bookmarks" className="text-muted-foreground hover:text-primary transition-colors">
            Bookmarks
          </Link>
          <Link to="/tasks" className="text-muted-foreground hover:text-primary transition-colors">
            Tasks
          </Link>
          <Link to="/notes" className="text-muted-foreground hover:text-primary transition-colors">
            Notes
          </Link>
        </nav>
        <div className="ml-auto flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {user ? user.email : 'Account'}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings">Settings</Link>
              </DropdownMenuItem>
              {user ? (
                <DropdownMenuItem onClick={handleSignOut}>
                  Sign out
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem asChild>
                  <Link to="/login">Sign in</Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;