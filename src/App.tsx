import { ThemeProvider } from "@/components/theme-provider";
import { Routes } from "./Routes";
import { FirebaseProvider } from "@/contexts/FirebaseContext";

function App() {
  return (
    <ThemeProvider defaultTheme="system" enableSystem>
      <FirebaseProvider>
        <div className="min-h-screen bg-background">
          <Routes />
        </div>
      </FirebaseProvider>
    </ThemeProvider>
  );
}

export default App;