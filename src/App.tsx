import { BrowserRouter as Router } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseProvider } from "@/contexts/FirebaseContext";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import { OnboardingOverlay } from "@/components/onboarding/OnboardingOverlay";
import Routes from "./Routes";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Router>
        <FirebaseProvider>
          <OnboardingProvider>
            <Routes />
            <OnboardingOverlay />
            <Toaster />
          </OnboardingProvider>
        </FirebaseProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;