import Navigation from "./Navigation";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <main className="flex-1 container mx-auto py-4 px-4 flex flex-col overflow-y-auto">
        {children}
      </main>
      <Navigation />
    </div>
  );
};

export default Layout;