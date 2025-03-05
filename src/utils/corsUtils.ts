
/**
 * Utilities for handling Cross-Origin Resource Sharing (CORS)
 */
import { toast } from 'sonner';
import { logger, createNamespacedLogger } from './loggerUtils';

const corsLogger = createNamespacedLogger('CORS');

/**
 * Sets CORS headers for fetch requests
 */
export const withCorsHeaders = (headers: HeadersInit = {}): HeadersInit => {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    ...headers
  };
};

/**
 * Creates a fetch request with CORS headers
 */
export const fetchWithCors = async (url: string, options: RequestInit = {}): Promise<Response> => {
  try {
    // Add CORS headers to the request
    const corsOptions: RequestInit = {
      ...options,
      headers: withCorsHeaders(options.headers),
      // Include credentials if needed (cookies, etc.)
      credentials: 'include'
    };

    // Add mode: 'cors' to explicitly request CORS behavior
    corsOptions.mode = 'cors';

    // Make the fetch request
    const response = await fetch(url, corsOptions);
    
    // Check if CORS error occurred
    if (!response.ok && response.status === 0) {
      corsLogger.error('CORS error occurred', { url });
      throw new Error('CORS error: Unable to access the resource');
    }
    
    return response;
  } catch (error) {
    corsLogger.error('Error in fetchWithCors', { url, error });
    
    // If it's a CORS error, show a specific message
    if (error instanceof Error && error.message.includes('CORS')) {
      toast.error('Cross-origin request blocked. Please check the console for details.');
    }
    
    throw error;
  }
};

/**
 * Creates a proxy URL to bypass CORS restrictions
 * @param url The original URL to proxy
 * @returns A proxied URL
 */
export const createProxyUrl = (url: string): string => {
  // Use a CORS proxy service
  // Note: In production, you should use your own proxy or a reliable service
  return `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
};

/**
 * Checks if a URL is accessible via CORS
 * @param url The URL to check
 * @returns true if accessible, false otherwise
 */
export const isCorsAccessible = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, {
      method: 'OPTIONS',
      mode: 'cors',
      headers: withCorsHeaders()
    });
    
    return response.ok;
  } catch (error) {
    corsLogger.warn('URL is not CORS accessible', { url, error });
    return false;
  }
};

/**
 * Handles the response from a proxied request
 * @param response The response from the proxy
 * @returns The original response data
 */
export const handleProxyResponse = async (response: Response): Promise<any> => {
  const data = await response.json();
  
  // If using allorigins proxy
  if (data.contents) {
    try {
      // If the contents is JSON
      return JSON.parse(data.contents);
    } catch {
      // If the contents is not JSON (HTML, text, etc.)
      return data.contents;
    }
  }
  
  return data;
};
