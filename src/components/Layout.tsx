
import Navigation from "./Navigation";
import Header from "./Header";
import { useEffect, useState, useRef } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({
  children
}: LayoutProps) => {
  const [isSidePanel, setIsSidePanel] = useState(false);
  const [isPopup, setIsPopup] = useState(false);
  const {
    theme
  } = useTheme();
  const defaultWidth = useRef<number>(0);
  const [currentWidth, setCurrentWidth] = useState<number>(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    isOffline
  } = useOfflineStatus({
    showToasts: true
  });
  const [serviceWorkerUpdated, setServiceWorkerUpdated] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js').then(registration => {
        console.log('ServiceWorker registered with scope:', registration.scope);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setServiceWorkerUpdated(true);
                toast.info('Update available! Refresh to update.', {
                  duration: 10000,
                  action: {
                    label: 'Update Now',
                    onClick: () => {
                      newWorker.postMessage({
                        type: 'SKIP_WAITING'
                      });
                      window.location.reload();
                    }
                  }
                });
              }
            });
          }
        });
      }).catch(error => {
        console.error('Error during service worker registration:', error);
      });

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('New service worker activated');
      });
    }
  }, []);

  useEffect(() => {
    const checkEnvironment = async () => {
      try {
        if (chrome?.sidePanel) {
          setIsSidePanel(true);

          await chrome.sidePanel.setPanelBehavior({
            openPanelOnActionClick: true
          });

          const initialWidth = window.innerWidth;
          defaultWidth.current = initialWidth;
          setCurrentWidth(initialWidth);

          document.body.style.width = '100%';
          document.body.style.height = '100vh';
          document.body.style.margin = '0';
          document.body.style.overflow = 'hidden';

          document.documentElement.setAttribute('data-high-contrast', 'true');

          const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
              const newWidth = entry.contentRect.width;
              const maxAllowedWidth = defaultWidth.current * 1.2;

              if (newWidth > maxAllowedWidth) {
                document.body.style.width = `${maxAllowedWidth}px`;
                toast.info("Maximum side panel width reached");
              }
              setCurrentWidth(Math.min(newWidth, maxAllowedWidth));
            }
          });
          resizeObserver.observe(document.body);

          return () => resizeObserver.disconnect();
        }

        if (window.innerWidth < 800 && window.innerHeight < 600) {
          setIsPopup(true);
        }
      } catch (error) {
        console.error('Error configuring side panel:', error);
      }
    };
    checkEnvironment();

    const handleResize = () => {
      if (isSidePanel) {
        const maxAllowedWidth = defaultWidth.current * 1.2;
        const newWidth = Math.min(window.innerWidth, maxAllowedWidth);
        document.documentElement.style.setProperty('--side-panel-width', `${newWidth}px`);
        setCurrentWidth(newWidth);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [isSidePanel]);

  return <div className={`min-h-screen bg-background text-foreground flex flex-col ${isSidePanel ? `w-full h-screen max-w-[${currentWidth}px] min-w-[300px]` : isPopup ? 'w-[350px] h-[500px]' : 'w-full'}`} style={{
    maxWidth: isSidePanel ? `${currentWidth}px` : undefined,
    transition: 'max-width 0.2s ease-out',
    overflow: !isSidePanel && !isPopup ? 'auto' : undefined
  }} role="main" aria-label="Main content area">
      <Header toggleSidebar={toggleSidebar} />
      
      {isOffline && <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-4 py-2 text-sm flex items-center justify-center">
          <span>You are offline. Some features may be limited.</span>
        </div>}
      
      {serviceWorkerUpdated && <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-4 py-2 text-sm flex items-center justify-center">
          <span>Update available! Refresh to update.</span>
          <button className="ml-2 underline" onClick={() => window.location.reload()}>
            Update Now
          </button>
        </div>}
      
      <main tabIndex={0} className="flex-1 w-full mx-auto flex flex-col overflow-y-auto">
        <div className="w-full mx-auto" style={{ paddingBottom: "70px" }}>
          {children}
        </div>
      </main>
      <Navigation />

      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-2 focus:bg-background focus:text-foreground">
        Skip to main content
      </a>
    </div>;
};

export default Layout;
