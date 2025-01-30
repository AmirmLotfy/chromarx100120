import Navigation from "./Navigation";
import Header from "./Header";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto py-4 px-4 md:px-6 flex flex-col overflow-y-auto max-w-7xl">
        <div className="mb-16 md:mb-0"> {/* Add bottom margin for mobile navigation */}
          {children}
        </div>
      </main>
      <Navigation />
    </div>
  );
};

export default Layout;