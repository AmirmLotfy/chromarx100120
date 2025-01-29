import React from "react";
import Navigation from "./Navigation";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-6 animate-fade-in overflow-hidden">
        {children}
      </main>
      <Navigation />
    </div>
  );
};

export default Layout;