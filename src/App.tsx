import { BrowserRouter } from 'react-router-dom'
import Routes from './Routes'
import { ThemeProvider } from './components/theme-provider'
import { Toaster } from './components/ui/toaster'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Routes />
        <Toaster />
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App