
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import Routes from "./Routes";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <Suspense fallback={<LoadingFallback />}>
        <Routes />
      </Suspense>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
