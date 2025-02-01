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
    root.classList.add(`theme-${colorScheme}`);
  }, [colorScheme]);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}