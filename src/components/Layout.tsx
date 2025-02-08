
import Navigation from "./Navigation";
import Header from "./Header";
import { useEffect, useState } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [isSidePanel, setIsSidePanel] = useState(false);
  const [isPopup, setIsPopup] = useState(false);

  useEffect(() => {
    // Check if running in Chrome extension side panel or popup
    const checkEnvironment = async () => {
      // Check if we're in the side panel
      if (chrome?.sidePanel) {
        setIsSidePanel(true);
        // Ensure proper sizing for side panel
        document.body.style.width = '100%';
        document.body.style.height = '100vh';
        document.body.style.margin = '0';
        document.body.style.overflow = 'hidden';
      }
      
      // Check if we're in a popup window
      if (window.innerWidth < 800 && window.innerHeight < 600) {
        setIsPopup(true);
      }
    };
    
    checkEnvironment();
  }, []);

  return (
    <div className={`min-h-screen bg-background text-foreground flex flex-col ${
      isSidePanel ? 'w-full h-screen max-w-[400px] min-w-[300px]' : 
      isPopup ? 'w-[350px] h-[500px]' : 'w-full'
    }`}>
      <Header />
      <main className="flex-1 w-full mx-auto flex flex-col overflow-y-auto pt-14 pb-16 md:pb-0">
        <div className="w-full mx-auto px-0">
          {children}
        </div>
      </main>
      <Navigation />
    </div>
  );
};

export default Layout;
