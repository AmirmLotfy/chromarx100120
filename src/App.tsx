
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import Routes from "./Routes";
import { Loader2 } from "lucide-react";
import { Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import RootErrorBoundary from "@/components/RootErrorBoundary";
import { registerUninstallCleanup } from "@/utils/cleanupUtils";
import { logger } from "@/utils/loggerUtils";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function App() {
  // Register the uninstall cleanup handler when the app starts
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      registerUninstallCleanup();
      logger.info('ChroMarx extension initialized');
    }
  }, []);

  return (
    <RootErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <Suspense fallback={<LoadingFallback />}>
            <Routes />
          </Suspense>
          <Toaster />
        </ThemeProvider>
      </QueryClientProvider>
    </RootErrorBoundary>
  );
}

export default App;
