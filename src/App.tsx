import { BrowserRouter as Router } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseProvider } from "@/contexts/FirebaseContext";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import { OnboardingOverlay } from "@/components/onboarding/OnboardingOverlay";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import Routes from "./Routes";

function App() {
  const [isVisible, setIsVisible] = useState(true);
  const [isSidePanelAvailable, setIsSidePanelAvailable] = useState(false);

  useEffect(() => {
    // Check if the side panel API is available (Chrome 114+)
    if (chrome?.sidePanel) {
      setIsSidePanelAvailable(true);
      
      // Configure side panel behavior to open on action click
      chrome.sidePanel
        .setPanelBehavior({ openPanelOnActionClick: true })
        .catch(console.error);
    }
  }, []);

  const toggleSidePanel = async () => {
    if (!chrome?.sidePanel) return;

    try {
      if (isVisible) {
        // Disable the side panel
        await chrome.sidePanel.setOptions({ enabled: false });
      } else {
        // Enable and open the side panel in the current window
        await chrome.sidePanel.setOptions({ enabled: true });
        await chrome.sidePanel.open({
          windowId: chrome.windows.WINDOW_ID_CURRENT
        });
      }
      setIsVisible(!isVisible);
    } catch (error) {
      console.error('Error toggling side panel:', error);
    }
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Router>
        <FirebaseProvider>
          <OnboardingProvider>
            <SidebarProvider>
              <div className="min-h-screen flex w-full">
                <Routes />
                <OnboardingOverlay />
                <Toaster />
                
                {/* Floating Toggle Button */}
                {isSidePanelAvailable && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                    onClick={toggleSidePanel}
                    title={isVisible ? "Hide Side Panel" : "Show Side Panel"}
                  >
                    {isVisible ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </SidebarProvider>
          </OnboardingProvider>
        </FirebaseProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;