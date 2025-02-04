import Navigation from "./Navigation";
import Header from "./Header";
import { useEffect, useState } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [isSidePanel, setIsSidePanel] = useState(false);

  useEffect(() => {
    // Check if running in Chrome extension side panel
    const checkEnvironment = async () => {
      if (chrome?.sidePanel) {
        setIsSidePanel(true);
      }
    };
    checkEnvironment();
  }, []);

  return (
    <div className={`min-h-screen bg-background text-foreground flex flex-col ${
      isSidePanel ? 'w-[25vw] max-w-[400px] min-w-[300px]' : 'w-full'
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