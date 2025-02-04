import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isExtension = process.env.VITE_BUILD_TARGET === 'extension';
  
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      // Provide a mock chrome API when running in browser
      'chrome.identity': !isExtension ? '{}' : undefined,
      'chrome.runtime': !isExtension ? '{}' : undefined,
      'chrome.storage': !isExtension ? '{}' : undefined,
      'chrome.bookmarks': !isExtension ? '{}' : undefined,
      'chrome.sidePanel': !isExtension ? '{}' : undefined,
      'chrome.tabs': !isExtension ? '{}' : undefined,
    },
  };
});