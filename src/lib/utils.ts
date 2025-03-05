
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format bytes to a human-readable format
 * @param bytes Number of bytes
 * @param decimals Number of decimal places to show
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Check if the Service Worker API is available in the browser
 */
export function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator;
}

/**
 * Register the service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    console.warn('Service workers are not supported in this browser');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    console.log('Service worker registered successfully:', registration.scope);
    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return null;
  }
}

/**
 * Update the service worker
 */
export async function updateServiceWorker(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      return false;
    }

    await registration.update();
    return true;
  } catch (error) {
    console.error('Service worker update failed:', error);
    return false;
  }
}

/**
 * Unregister the service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      return false;
    }

    return await registration.unregister();
  } catch (error) {
    console.error('Service worker unregistration failed:', error);
    return false;
  }
}

/**
 * Check if the app is running in a Chrome Extension context
 */
export function isChromeExtension(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id;
}

/**
 * Check if the app is running in a Chrome Extension side panel
 */
export function isChromeSidePanel(): boolean {
  return isChromeExtension() && typeof chrome.sidePanel !== 'undefined';
}

/**
 * Check if the current browser supports all required APIs
 */
export function checkBrowserSupport(): { supported: boolean; missingFeatures: string[] } {
  const requiredFeatures = [
    { name: 'Service Worker', supported: 'serviceWorker' in navigator },
    { name: 'IndexedDB', supported: 'indexedDB' in window },
    { name: 'Cache API', supported: 'caches' in window },
    { name: 'Fetch API', supported: 'fetch' in window },
    { name: 'Web Workers', supported: 'Worker' in window }
  ];
  
  const missingFeatures = requiredFeatures
    .filter(feature => !feature.supported)
    .map(feature => feature.name);
  
  return {
    supported: missingFeatures.length === 0,
    missingFeatures
  };
}
