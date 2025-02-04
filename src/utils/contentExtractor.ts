export const extractPageContent = async (url: string): Promise<string> => {
  try {
    // First try using fetch
    const response = await fetch(url);
    const html = await response.text();
    
    // Create a DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Remove unwanted elements
    const elementsToRemove = doc.querySelectorAll(
      'script, style, nav, header, footer, iframe, [role="banner"], [role="navigation"], .advertisement, .ads, #comments'
    );
    elementsToRemove.forEach(el => el.remove());
    
    // Get main content (prioritize main content areas)
    const mainContent = doc.querySelector('main, article, [role="main"], .main-content, #main-content');
    if (mainContent) {
      return mainContent.textContent?.trim() || '';
    }
    
    // Fallback to body content if no main content area is found
    const bodyContent = doc.body.textContent?.trim() || '';
    return bodyContent.slice(0, 5000); // Limit content length for API constraints
  } catch (error) {
    console.error('Error extracting page content:', error);
    return ''; // Return empty string if extraction fails
  }
};

// Clean and format extracted content
export const cleanContent = (content: string): string => {
  return content
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();
};

// Add new utility functions
export const fetchPageContent = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const html = await response.text();
    return extractContentFromHtml(html);
  } catch (error) {
    console.error('Error fetching page content:', error);
    return '';
  }
};

export const extractContentFromHtml = (html: string): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Remove unwanted elements
  const elementsToRemove = doc.querySelectorAll(
    'script, style, nav, header, footer, iframe, .ad, .advertisement, .social-share'
  );
  elementsToRemove.forEach(el => el.remove());

  // Extract main content
  const mainContent = doc.querySelector('main, article, [role="main"], .content, #content');
  const content = mainContent ? mainContent.textContent : doc.body.textContent;

  return cleanContent(content || '');
};
