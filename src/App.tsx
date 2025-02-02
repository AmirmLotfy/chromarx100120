import { BrowserRouter } from 'react-router-dom'
import Routes from './Routes'
import { ThemeProvider } from './components/theme-provider'
import { Toaster } from './components/ui/toaster'
import { OnboardingProvider } from './components/onboarding/OnboardingProvider'
import { FirebaseProvider } from '@/contexts/FirebaseContext'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <FirebaseProvider>
          <OnboardingProvider>
            <Routes />
            <Toaster />
          </OnboardingProvider>
        </FirebaseProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App