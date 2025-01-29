import { BrowserRouter as Router } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseProvider } from "@/contexts/FirebaseContext";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import { OnboardingOverlay } from "@/components/onboarding/OnboardingOverlay";
import Routes from "./Routes";

function App() {
  return (
    <FirebaseProvider>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <OnboardingProvider>
          <Router>
            <Routes />
            <OnboardingOverlay />
            <Toaster />
          </Router>
        </OnboardingProvider>
      </ThemeProvider>
    </FirebaseProvider>
  );
}

export default App;