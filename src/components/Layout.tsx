import React from "react";
import Navigation from "./Navigation";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const isMobile = useIsMobile();

  return (
    <div className={`min-h-screen bg-background text-foreground flex flex-col ${
      isMobile ? 'h-[100dvh]' : ''
    }`}>
      <main className={`flex-1 container mx-auto px-4 py-6 animate-fade-in ${
        isMobile ? 'h-[calc(100dvh-4rem)] overflow-hidden' : ''
      }`}>
        {children}
      </main>
      <Navigation />
    </div>
  );
};

export default Layout;