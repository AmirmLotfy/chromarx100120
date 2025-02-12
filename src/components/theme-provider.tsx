
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"
import { useSettings } from "@/stores/settingsStore"
import { Toaster } from "sonner"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const { colorScheme } = useSettings();
  const [currentTheme, setCurrentTheme] = React.useState<string | undefined>(props.defaultTheme);

  React.useEffect(() => {
    // Apply color scheme classes to the root element
    const root = document.documentElement;
    root.classList.remove('theme-default', 'theme-purple', 'theme-blue', 'theme-green');
    if (colorScheme !== 'default') {
      root.classList.add(`theme-${colorScheme}`);
    }

    // Set up system theme listener
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (currentTheme === 'system') {
        document.documentElement.classList.toggle('dark', e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    
    // Initial system theme check
    if (currentTheme === 'system') {
      document.documentElement.classList.toggle('dark', mediaQuery.matches);
    }

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [colorScheme, currentTheme]);

  // Update currentTheme when defaultTheme changes
  React.useEffect(() => {
    setCurrentTheme(props.defaultTheme);
  }, [props.defaultTheme]);

  return (
    <NextThemesProvider 
      {...props}
      attribute="class"
      defaultTheme="system"
      enableSystem
    >
      {children}
      <Toaster
        closeButton
        richColors
        theme={currentTheme as "light" | "dark" | "system"}
        className="theme-aware-toaster"
        toastOptions={{
          unstyled: false,
          classNames: {
            toast: "group toast-theme-aware",
            title: "font-medium text-foreground",
            description: "text-muted-foreground",
            error: "bg-destructive text-destructive-foreground",
            success: "bg-primary text-primary-foreground",
            warning: "bg-orange-500 text-white",
            info: "bg-blue-500 text-white",
          },
          duration: 3000,
        }}
      />
    </NextThemesProvider>
  );
}
