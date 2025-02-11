
import { toast } from "sonner";

const MAX_CONTENT_LENGTH = 10000; // Limit content length for AI processing

export const extractPageContent = async (url: string): Promise<string> => {
  try {
    // First try direct fetch
    const response = await fetch(url, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    
    // Create a DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Remove unwanted elements
    const elementsToRemove = doc.querySelectorAll(
      'script, style, nav, header, footer, iframe, [role="banner"], [role="navigation"], .advertisement, .ads, #comments, .share, .social, .related'
    );
    elementsToRemove.forEach(el => el.remove());
    
    // Get main content (prioritize main content areas)
    const mainContent = doc.querySelector('main, article, [role="main"], .main-content, #main-content, .content, #content');
    let content = '';
    
    if (mainContent) {
      content = cleanContent(mainContent.textContent || '');
    } else {
      // Fallback to body content if no main content area is found
      content = cleanContent(doc.body.textContent || '');
    }

    // Limit content length
    return content.slice(0, MAX_CONTENT_LENGTH);
  } catch (error) {
    console.error('Error extracting page content:', error);
    if (error instanceof TypeError && error.message.includes('CORS')) {
      toast.error("Unable to access page content due to website restrictions");
    }
    return ''; // Return empty string if extraction fails
  }
};

// Clean and format extracted content
export const cleanContent = (content: string): string => {
  return content
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
    .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable characters
    .trim();
};

// Fetch and extract content from URL with caching
const contentCache = new Map<string, { content: string; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const fetchPageContent = async (url: string): Promise<string> => {
  try {
    // Check cache first
    const cached = contentCache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.content;
    }

    // If not in cache or expired, fetch new content
    const content = await extractPageContent(url);
    
    // Cache the result
    if (content) {
      contentCache.set(url, {
        content,
        timestamp: Date.now()
      });
    }

    return content;
  } catch (error) {
    console.error('Error fetching page content:', error);
    toast.error(`Failed to fetch content from ${url}`);
    return '';
  }
};

// Batch process multiple URLs with progress tracking
export const batchFetchContent = async (
  urls: string[],
  onProgress?: (progress: number) => void
): Promise<Map<string, string>> => {
  const results = new Map<string, string>();
  let completed = 0;

  await Promise.all(
    urls.map(async (url) => {
      try {
        const content = await fetchPageContent(url);
        results.set(url, content);
        completed++;
        onProgress?.(Math.round((completed / urls.length) * 100));
      } catch (error) {
        console.error(`Failed to fetch content for ${url}:`, error);
        results.set(url, '');
      }
    })
  );

  return results;
};
