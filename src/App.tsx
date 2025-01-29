import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { FirebaseProvider } from "@/contexts/FirebaseContext";
import { GeminiProvider } from "@/contexts/GeminiContext";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import Routes from "./Routes";
import { Toaster } from "sonner";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <FirebaseProvider>
          <GeminiProvider>
            <OnboardingProvider>
              <Routes />
              <Toaster position="top-center" />
            </OnboardingProvider>
          </GeminiProvider>
        </FirebaseProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;