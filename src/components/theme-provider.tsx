"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"
import { useSettings } from "@/stores/settingsStore"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const { colorScheme } = useSettings();

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
      if (props.theme === 'system') {
        document.documentElement.classList.toggle('dark', e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    
    // Initial system theme check
    if (props.theme === 'system') {
      document.documentElement.classList.toggle('dark', mediaQuery.matches);
    }

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [colorScheme, props.theme]);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}