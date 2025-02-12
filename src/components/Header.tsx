
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { LanguageSelector } from "./LanguageSelector";
import { toast } from "sonner";

const Header = () => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    toast.success(`Theme changed to ${newTheme} mode`, {
      duration: 2000,
      className: "theme-toggle-toast",
    });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container h-full max-w-screen-xl mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-full gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <img 
              src="/lovable-uploads/c57439a4-ac35-4ae6-ac00-dd8f5ef8a360.png" 
              alt="ChroMarx Logo" 
              className="h-7 w-auto object-contain"
            />
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-2">
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
      </div>
    </header>
  );
};

export default Header;
