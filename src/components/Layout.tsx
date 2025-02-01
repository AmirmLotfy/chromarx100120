import Navigation from "./Navigation";
import Header from "./Header";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col w-full">
      <Header />
      <main className="flex-1 w-full mx-auto flex flex-col overflow-y-auto">
        <div className="container max-w-screen-xl mx-auto mb-16 md:mb-0 w-full px-4 pt-6">
          {children}
        </div>
      </main>
      <Navigation />
    </div>
  );
};

export default Layout;