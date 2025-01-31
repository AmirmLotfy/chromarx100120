import Navigation from "./Navigation";
import Header from "./Header";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1 w-full mx-auto py-2 px-2 sm:px-4 md:px-6 flex flex-col overflow-y-auto">
        <div className="mb-16 md:mb-0 max-w-full"> {/* Removed fixed max-width and adjusted margins */}
          {children}
        </div>
      </main>
      <Navigation />
    </div>
  );
};

export default Layout;