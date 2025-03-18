
import { toast } from "sonner";

// Sanitize URL to prevent security issues
const sanitizeUrl = (url: string): string => {
  try {
    const parsedUrl = new URL(url);
    // Only allow http and https protocols
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error('Invalid URL protocol');
    }
    return parsedUrl.toString();
  } catch (error) {
    throw new Error('Invalid URL format');
  }
};

// Sanitize input to prevent XSS
const sanitizeInput = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

export interface BookmarkProcessingResult {
  url: string;
  title: string;
  processed_at: string;
  domain: string;
}

export const BookmarkProcessingService = {
  async processBookmark(url: string, title?: string): Promise<BookmarkProcessingResult> {
    try {
      if (!url) {
        throw new Error("URL is required");
      }
      
      // Sanitize and validate URL format
      const sanitizedUrl = sanitizeUrl(url);
      const sanitizedTitle = title ? sanitizeInput(title) : "Untitled";

      // Extract domain from URL
      const domainMatch = sanitizedUrl.match(/^https?:\/\/([^/?#]+)(?:[/?#]|$)/i);
      const domain = domainMatch ? domainMatch[1] : "unknown-domain";
      
      // Process the bookmark
      const processedData = {
        url: sanitizedUrl,
        title: sanitizedTitle,
        processed_at: new Date().toISOString(),
        domain
      };

      console.log('Processing bookmark:', { 
        url: sanitizedUrl,
        domain,
        processed_at: processedData.processed_at 
      });

      return processedData;
    } catch (error) {
      console.error('Error processing bookmark:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process bookmark');
      throw error;
    }
  }
};
