import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import Routes from "./Routes";
import { ChromeAuthProvider } from "./contexts/ChromeAuthContext";
import { OnboardingProvider } from "./components/onboarding/OnboardingProvider";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <ChromeAuthProvider>
        <OnboardingProvider>
          <Routes />
          <Toaster />
        </OnboardingProvider>
      </ChromeAuthProvider>
    </ThemeProvider>
  );
}

export default App;