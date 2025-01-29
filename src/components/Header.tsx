import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, LogOut, LogIn } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFirebase } from "@/contexts/FirebaseContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Header = () => {
  const { user, signInWithGoogle, signOut } = useFirebase();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/');
      toast.error("Please sign in to continue");
    }
  }, [user, navigate]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex items-center -ml-2">
          <Link to="/" className="flex items-center">
            <img 
              src="/lovable-uploads/beb46658-15c1-4b7f-88fa-ef04d641652b.png" 
              alt="ChroMarx" 
              className="h-6 md:h-8" 
            />
          </Link>
        </div>
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium ml-8">
          {user && (
            <>
              <Link to="/bookmarks" className="text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground px-3 py-2 rounded-md">
                Bookmarks
              </Link>
              <Link to="/tasks" className="text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground px-3 py-2 rounded-md">
                Tasks
              </Link>
              <Link to="/notes" className="text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground px-3 py-2 rounded-md">
                Notes
              </Link>
            </>
          )}
        </nav>
        <div className="ml-auto flex items-center space-x-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="relative h-9 w-9 rounded-full"
                >
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || 'User'} 
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  {user.displayName || user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="w-full cursor-pointer">
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={signOut}
                  className="text-red-500 cursor-pointer focus:text-red-500"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              onClick={signInWithGoogle}
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-accent"
            >
              <LogIn className="h-4 w-4" />
              <span className="sr-only">Sign in</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;