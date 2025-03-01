import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import Routes from "./Routes";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";
import { useEffect } from "react";
import { registerDevice } from "@/lib/chrome-utils";

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function App() {
  useEffect(() => {
    registerDevice().then(success => {
      if (success) {
        console.log("Device registered successfully");
      }
    });
  }, []);

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
