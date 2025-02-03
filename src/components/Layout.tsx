import Navigation from "./Navigation";
import Header from "./Header";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1 w-full mx-auto flex flex-col overflow-y-auto pt-14 pb-16 md:pb-0">
        <div className="container max-w-screen-xl mx-auto px-2 sm:px-4 py-2 sm:py-4 md:py-6">
          {children}
        </div>
      </main>
      <Navigation />
    </div>
  );
};

export default Layout;