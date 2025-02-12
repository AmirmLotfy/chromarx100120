
import Navigation from "./Navigation";
import Header from "./Header";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [isSidePanel, setIsSidePanel] = useState(false);
  const [isPopup, setIsPopup] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    // Check if running in Chrome extension side panel or popup
    const checkEnvironment = async () => {
      try {
        // Check if we're in the side panel
        if (chrome?.sidePanel) {
          setIsSidePanel(true);
          
          // Configure side panel behavior
          await chrome.sidePanel.setPanelBehavior({ 
            openPanelOnActionClick: true 
          });
          
          // Apply proper sizing for side panel
          document.body.style.width = '100%';
          document.body.style.height = '100vh';
          document.body.style.margin = '0';
          document.body.style.overflow = 'hidden';
          
          // Add high-contrast support
          document.documentElement.setAttribute('data-high-contrast', 'true');
        }
        
        // Check if we're in a popup window
        if (window.innerWidth < 800 && window.innerHeight < 600) {
          setIsPopup(true);
        }
      } catch (error) {
        console.error('Error configuring side panel:', error);
      }
    };
    
    checkEnvironment();

    // Handle window resize for responsive layout
    const handleResize = () => {
      const width = window.innerWidth;
      document.documentElement.style.setProperty('--side-panel-width', `${width}px`);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div 
      className={`min-h-screen bg-background text-foreground flex flex-col ${
        isSidePanel ? 'w-full h-screen max-w-[400px] min-w-[300px]' : 
        isPopup ? 'w-[350px] h-[500px]' : 'w-full'
      }`}
      // Add accessibility attributes
      role="main"
      aria-label="Main content area"
    >
      <Header />
      <main 
        className="flex-1 w-full mx-auto flex flex-col overflow-y-auto pt-14 pb-20"
        // Improve keyboard navigation
        tabIndex={0}
      >
        <div className="w-full mx-auto px-0">
          {children}
        </div>
      </main>
      <Navigation />

      {/* Skip link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-2 focus:bg-background focus:text-foreground"
      >
        Skip to main content
      </a>
    </div>
  );
};

export default Layout;
