import Navigation from "./Navigation";
import Header from "./Header";
import { useEffect, useState } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  useEffect(() => {
    // Initialize side panel state
    if (chrome.sidePanel) {
      chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
        .catch(console.error);
    }

    // Listen for panel visibility changes
    const handleVisibilityChange = (isVisible: boolean) => {
      setIsPanelOpen(isVisible);
    };

    if (chrome.sidePanel) {
      chrome.sidePanel.onVisibilityChanged.addListener(handleVisibilityChange);
    }

    return () => {
      if (chrome.sidePanel) {
        chrome.sidePanel.onVisibilityChanged.removeListener(handleVisibilityChange);
      }
    };
  }, []);

  return (
    <div className={`min-h-screen bg-background text-foreground flex flex-col ${
      isPanelOpen ? 'w-[25vw]' : 'w-full'
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