
import React from 'react';
import Header from './Header';
import ExtensionModeBanner from './ExtensionModeBanner';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Add the ExtensionModeBanner here */}
        <div className="container mx-auto px-4 py-2">
          <ExtensionModeBanner />
        </div>
        {children}
      </main>
    </div>
  );
};

export default Layout;
