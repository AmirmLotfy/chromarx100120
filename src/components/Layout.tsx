
import Navigation from "./Navigation";
import Header from "./Header";
import { useEffect, useState, useRef } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [isSidePanel, setIsSidePanel] = useState(false);
  const [isPopup, setIsPopup] = useState(false);
  const { theme } = useTheme();
  const defaultWidth = useRef<number>(0);
  const [currentWidth, setCurrentWidth] = useState<number>(0);

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
          
          // Store initial width as default
          const initialWidth = window.innerWidth;
          defaultWidth.current = initialWidth;
          setCurrentWidth(initialWidth);

          // Apply proper sizing for side panel
          document.body.style.width = '100%';
          document.body.style.height = '100vh';
          document.body.style.margin = '0';
          document.body.style.overflow = 'hidden';
          
          // Add high-contrast support
          document.documentElement.setAttribute('data-high-contrast', 'true');

          // Set up resize observer to enforce width constraints
          const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
              const newWidth = entry.contentRect.width;
              const maxAllowedWidth = defaultWidth.current * 1.2; // 20% more than default

              if (newWidth > maxAllowedWidth) {
                // Prevent exceeding max width
                document.body.style.width = `${maxAllowedWidth}px`;
                toast.info("Maximum side panel width reached");
              }
              setCurrentWidth(Math.min(newWidth, maxAllowedWidth));
            }
          });

          resizeObserver.observe(document.body);

          // Cleanup observer on unmount
          return () => resizeObserver.disconnect();
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
      if (isSidePanel) {
        const maxAllowedWidth = defaultWidth.current * 1.2;
        const newWidth = Math.min(window.innerWidth, maxAllowedWidth);
        document.documentElement.style.setProperty('--side-panel-width', `${newWidth}px`);
        setCurrentWidth(newWidth);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call

    return () => window.removeEventListener('resize', handleResize);
  }, [isSidePanel]);

  return (
    <div 
      className={`min-h-screen bg-background text-foreground flex flex-col ${
        isSidePanel ? `w-full h-screen max-w-[${currentWidth}px] min-w-[300px]` : 
        isPopup ? 'w-[350px] h-[500px]' : 'w-full'
      }`}
      style={{
        maxWidth: isSidePanel ? `${currentWidth}px` : undefined,
        transition: 'max-width 0.2s ease-out'
      }}
      role="main"
      aria-label="Main content area"
    >
      <Header />
      <main 
        className="flex-1 w-full mx-auto flex flex-col overflow-y-auto pt-14 pb-20"
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
