import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Settings, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center space-x-2 md:mr-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] p-0">
              <ScrollArea className="h-full px-2">
                <div className="flex flex-col space-y-3 p-4">
                  <Link to="/" className="flex items-center space-x-2">
                    <img src="/logo.png" alt="ChroMarx" className="h-6" />
                  </Link>
                  <nav className="flex flex-col space-y-2">
                    <Link to="/bookmarks" className="text-muted-foreground hover:text-primary">
                      Bookmarks
                    </Link>
                    <Link to="/tasks" className="text-muted-foreground hover:text-primary">
                      Tasks
                    </Link>
                    <Link to="/notes" className="text-muted-foreground hover:text-primary">
                      Notes
                    </Link>
                  </nav>
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
          <Link to="/" className="flex items-center space-x-2">
            <img src="/logo.png" alt="ChroMarx" className="h-6" />
          </Link>
        </div>
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
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
          <Link to="/settings">
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;