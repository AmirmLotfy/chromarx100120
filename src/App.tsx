import { ThemeProvider } from "@/components/theme-provider";
import Routes from "./Routes";
import { FirebaseProvider } from "@/contexts/FirebaseContext";
import { BrowserRouter } from "react-router-dom";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="system" storageKey="chromarx-theme" enableSystem>
        <FirebaseProvider>
          <OnboardingProvider>
            <div className="min-h-screen bg-background">
              <Routes />
            </div>
          </OnboardingProvider>
        </FirebaseProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;