import { BrowserRouter } from 'react-router-dom'
import Routes from './Routes'
import { ThemeProvider } from './components/theme-provider'
import { Toaster } from './components/ui/toaster'
import { OnboardingProvider } from './components/onboarding/OnboardingProvider'
import { AuthProvider } from '@/contexts/AuthContext'
import { SidebarProvider } from './components/ui/sidebar'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <AuthProvider>
          <OnboardingProvider>
            <SidebarProvider>
              <Routes />
              <Toaster />
            </SidebarProvider>
          </OnboardingProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App