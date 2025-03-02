
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun, User, LogOut, Menu } from "lucide-react";
import { LanguageSelector } from "./LanguageSelector";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

const Header = () => {
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    toast.success(`Theme changed to ${newTheme} mode`, {
      duration: 2000,
      className: "theme-toggle-toast",
    });
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <>
      <header 
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/40 py-2.5 px-4"
        role="banner"
        aria-label="Application header"
      >
        <div className="container h-full max-w-screen-xl mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-full gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <img 
                src="/lovable-uploads/c57439a4-ac35-4ae6-ac00-dd8f5ef8a360.png" 
                alt="ChroMarx Logo" 
                className="h-8 w-auto object-contain"
              />
            </div>
            
            {isMobile ? (
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 rounded-full p-0"
                  onClick={toggleTheme}
                  aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                >
                  <Sun className="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 rounded-full p-0"
                  onClick={toggleMenu}
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {user ? (
                  <div className="flex items-center gap-2">
                    <Link to="/user">
                      <Button variant="ghost" size="sm" className="gap-1 h-8 rounded-full">
                        <User className="h-4 w-4" />
                        <span className="hidden md:inline">{user.email?.split('@')[0] || 'Account'}</span>
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => signOut()}
                      aria-label="Sign out"
                      title="Sign out"
                      className="h-8 w-8 rounded-full p-0"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Link to="/auth">
                    <Button size="sm" variant="outline" className="gap-1 rounded-full h-8">
                      <User className="h-4 w-4" />
                      <span>Sign In</span>
                    </Button>
                  </Link>
                )}
                
                <div className="flex items-center gap-2">
                  <LanguageSelector />
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    className="h-8 w-8 rounded-full transition-colors hover:bg-accent"
                  >
                    <Sun className="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[3.5rem] left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/40 shadow-lg"
          >
            <div className="container py-3 px-4 space-y-3">
              {user ? (
                <>
                  <Link to="/user" onClick={() => setMenuOpen(false)}>
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/10">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{user.email?.split('@')[0] || 'Account'}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </Link>
                  
                  <div className="h-px bg-border/50 my-2" />
                  
                  <button 
                    className="flex w-full items-center gap-3 p-2 rounded-lg hover:bg-accent/10"
                    onClick={() => {
                      signOut();
                      setMenuOpen(false);
                    }}
                  >
                    <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
                      <LogOut className="h-4 w-4 text-destructive" />
                    </div>
                    <span className="text-sm">Sign Out</span>
                  </button>
                </>
              ) : (
                <Link to="/auth" onClick={() => setMenuOpen(false)}>
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/10">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">Sign In</span>
                  </div>
                </Link>
              )}
              
              <div className="h-px bg-border/50 my-2" />
              
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/10">
                <span className="text-sm">Language</span>
                <LanguageSelector />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
