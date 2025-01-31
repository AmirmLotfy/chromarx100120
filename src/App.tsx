import { ThemeProvider } from "@/components/theme-provider";
import Routes from "./Routes";
import { FirebaseProvider } from "@/contexts/FirebaseContext";
import { BrowserRouter } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="system" enableSystem>
        <FirebaseProvider>
          <div className="min-h-screen bg-background">
            <Routes />
          </div>
        </FirebaseProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;