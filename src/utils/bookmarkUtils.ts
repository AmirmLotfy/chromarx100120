import { ChromeBookmark } from "@/types/bookmark";
import { getGeminiResponse } from "./geminiUtils";
import { fetchPageContent } from "./contentExtractor";
import { toast } from "sonner";

/**
 * Find bookmarks by analyzing their content against a search query
 * Uses AI to compare bookmark content with the search query
 * @param query User's search query
 * @param bookmarks Array of bookmarks to search through
 * @returns Array of bookmarks that match the query
 */
export const findBookmarksByContent = async (
  query: string,
  bookmarks: ChromeBookmark[]
): Promise<ChromeBookmark[]> => {
  try {
    // First filter to limit processing to a reasonable subset
    // Look at titles and URLs to narrow down potential matches
    const potentialMatches = bookmarks.filter(bookmark => {
      const titleLower = bookmark.title.toLowerCase();
      const urlLower = bookmark.url?.toLowerCase() || '';
      const queryTerms = query.toLowerCase().split(/\s+/);
      
      // Check if any query term appears in title or URL
      return queryTerms.some(term => 
        titleLower.includes(term) || urlLower.includes(term)
      );
    });

    // If we have too many potential matches, limit them
    const bookmarksToProcess = potentialMatches.length > 20 
      ? potentialMatches.slice(0, 20) 
      : potentialMatches;
    
    if (bookmarksToProcess.length === 0) {
      // Fall back to returning all bookmarks for further processing
      return bookmarks.slice(0, 20);
    }

    // Prepare content for AI analysis
    const bookmarkDetails = await Promise.all(
      bookmarksToProcess.map(async (bookmark) => {
        let content = '';
        
        // Use cached content or summary if available
        if (bookmark.content) {
          content = bookmark.content;
        } else if (bookmark.metadata?.summary) {
          content = bookmark.metadata.summary;
        } else if (bookmark.url) {
          // Try to fetch content
          try {
            content = await fetchPageContent(bookmark.url);
          } catch (error) {
            console.error(`Error fetching content for ${bookmark.url}:`, error);
            content = bookmark.title;
          }
        }

        return {
          id: bookmark.id,
          title: bookmark.title,
          url: bookmark.url || "",
          content: content.slice(0, 1000) // Limit content length
        };
      })
    );

    // Create AI prompt for content matching
    const prompt = `
I need to find bookmarks that match this search query: "${query}"

Here are the bookmarks to analyze:
${bookmarkDetails.map((bookmark, index) => `
[${index + 1}] Title: ${bookmark.title}
URL: ${bookmark.url}
Content: ${bookmark.content || "No content available"}
`).join('\n---\n')}

Return ONLY a comma-separated list of bookmark indices (the numbers in square brackets) 
that are relevant to the search query. If none are relevant, return "NONE".
Example response: "1,4,7" or "NONE"
Do not include any other text or explanations.
`;

    // Get AI response
    const { result } = await getGeminiResponse({
      prompt,
      type: 'analytics',
      language: 'en',
      maxRetries: 2
    });

    // Process the response
    if (result.includes("NONE")) {
      return [];
    }

    // Parse indices from result (1,3,5 format)
    const matchedIndices = result.split(',')
      .map(index => parseInt(index.trim()))
      .filter(index => !isNaN(index) && index > 0 && index <= bookmarksToProcess.length)
      .map(index => index - 1); // Convert to zero-based indices

    // Return matched bookmarks
    return matchedIndices.map(index => bookmarksToProcess[index]);
  } catch (error) {
    console.error('Error finding bookmarks by content:', error);
    toast.error('Error searching bookmark content');
    return [];
  }
};
