import { BrowserRouter as Router } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseProvider } from "@/contexts/FirebaseContext";
import Routes from "./Routes";

function App() {
  return (
    <FirebaseProvider>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Router>
          <Routes />
          <Toaster />
        </Router>
      </ThemeProvider>
    </FirebaseProvider>
  );
}

export default App;