
import Navigation from "@/components/Navigation";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  
  // Debug logging for layout rendering
  useEffect(() => {
    console.log("Layout rendered with path:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 mb-16 pb-4 relative">
        {children}
      </main>
      <Navigation />
    </div>
  );
};

export default Layout;
