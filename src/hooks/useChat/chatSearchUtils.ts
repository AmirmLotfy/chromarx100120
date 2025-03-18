
// Fix type issues for summarizeContent function calls
import { ChromeBookmark } from "@/types/bookmark";
import { findBookmarksByContent } from "@/utils/bookmarkUtils";
import { summarizeContent } from "@/utils/geminiUtils";
import { searchWebResults } from "@/utils/searchUtils";
import { aiRequestManager } from "@/utils/aiRequestManager";
import { retryWithBackoff } from "@/utils/retryUtils";
import { Language } from "@/stores/languageStore";
import { getContextFromHistory, generateChatPrompt } from "@/utils/chatContextUtils";
import { Message } from "@/types/chat";
import { BookmarkSearchResult, QueryResult } from "./types";

export const searchBookmarks = (query: string, bookmarks: ChromeBookmark[]) => {
  return bookmarks.filter((bookmark) => {
    const titleMatch = bookmark.title.toLowerCase().includes(query.toLowerCase());
    const urlMatch = bookmark.url?.toLowerCase().includes(query.toLowerCase());
    const categoryMatch = bookmark.category?.toLowerCase().includes(query.toLowerCase());
    return titleMatch || urlMatch || categoryMatch;
  });
};

export const processBookmarkSearch = async (
  query: string,
  bookmarks: ChromeBookmark[],
  isOffline: boolean,
  isAIAvailable: boolean,
  currentLanguage: Language
): Promise<BookmarkSearchResult> => {
  try {
    if (isOffline) {
      throw new Error("You're currently offline. Please check your connection and try again.");
    }
    
    if (!isAIAvailable) {
      throw new Error("AI service is currently unavailable. Please try again later.");
    }

    // Check for rate limiting
    const throttleCheck = await aiRequestManager.isThrottled();
    if (throttleCheck.throttled) {
      throw new Error(`Request rate limited: ${throttleCheck.reason || "Too many requests"}`);
    }

    // Step 1: Use the advanced bookmark search by content
    const contentMatchedBookmarks = await findBookmarksByContent(query, bookmarks);
    
    // Step 2: Also search by metadata (title, URL, category)
    const metadataMatchedBookmarks = searchBookmarks(query, bookmarks);
    
    // Step 3: Combine results uniquely (by ID)
    const allBookmarkIds = new Set();
    const combinedBookmarks = [];
    
    // First add content matches (likely most relevant)
    for (const bookmark of contentMatchedBookmarks) {
      if (!allBookmarkIds.has(bookmark.id)) {
        allBookmarkIds.add(bookmark.id);
        combinedBookmarks.push(bookmark);
      }
    }
    
    // Then add metadata matches
    for (const bookmark of metadataMatchedBookmarks) {
      if (!allBookmarkIds.has(bookmark.id)) {
        allBookmarkIds.add(bookmark.id);
        combinedBookmarks.push(bookmark);
      }
    }

    // Step 4: Prepare prompt for AI
    const promptContent = `
Query: "${query}"

Found ${combinedBookmarks.length} potential bookmark matches.

Bookmark details:
${combinedBookmarks.map((bookmark, index) => `
[${index + 1}] Title: ${bookmark.title}
URL: ${bookmark.url || "N/A"}
Category: ${bookmark.category || "Uncategorized"}
${bookmark.metadata?.summary ? `Summary: ${bookmark.metadata.summary}` : ""}
`).join('\n')}

Based on the user's query and the bookmarks found, please:
1. Identify which bookmarks most likely match what the user is looking for
2. Explain why these are relevant to the query
3. If no exact matches were found, suggest related bookmarks or search refinements
4. Format your response in a clear, readable way listing the most relevant bookmarks first
`;

    // Step 5: Get AI response for bookmark search results
    const response = await aiRequestManager.makeRequest(
      () => retryWithBackoff(
        () => summarizeContent(promptContent, currentLanguage.code),
        {
          maxRetries: 3,
          initialDelay: 1000,
          onRetry: (error, attempt) => {
            console.log(`Retry attempt ${attempt} after error:`, error);
          }
        }
      ),
      `bookmark_search_${query.slice(0, 20)}_${currentLanguage.code}`,
      "I couldn't find any bookmarks matching your query. Try using different keywords or a more specific description."
    );

    // Fix type issue: Ensure response is a string
    const responseStr = typeof response === 'string' ? response : JSON.stringify(response);

    return {
      response: responseStr,
      bookmarks: combinedBookmarks.slice(0, 5).map((b) => ({
        title: b.title,
        url: b.url || "",
        relevance: 1,
      })),
    };
  } catch (error) {
    console.error("Error processing bookmark search:", error);
    throw error;
  }
};

export const processQuery = async (
  query: string,
  messages: Message[],
  bookmarks: ChromeBookmark[],
  isOffline: boolean,
  isAIAvailable: boolean,
  currentLanguage: Language
): Promise<QueryResult> => {
  try {
    if (isOffline) {
      throw new Error("You're currently offline. Please check your connection and try again.");
    }
    
    if (!isAIAvailable) {
      throw new Error("AI service is currently unavailable. Please try again later.");
    }

    // Check for rate limiting
    const throttleCheck = await aiRequestManager.isThrottled();
    if (throttleCheck.throttled) {
      throw new Error(`Request rate limited: ${throttleCheck.reason || "Too many requests"}`);
    }

    // Run bookmark search and web search in parallel
    const [relevantBookmarks, webResults] = await Promise.all([
      Promise.resolve(searchBookmarks(query, bookmarks)),
      searchWebResults(query).catch(err => {
        console.error("Web search error:", err);
        return []; // Fallback to empty results on error
      }),
    ]);

    const bookmarkContext = relevantBookmarks
      .map((b) => `${b.title} (${b.url})`)
      .join("\n");

    const chatContext = getContextFromHistory(messages, query);
    const prompt = generateChatPrompt(query, bookmarkContext, chatContext, currentLanguage);

    // Use the AI request manager for rate limiting and caching
    const response = await aiRequestManager.makeRequest(
      () => retryWithBackoff(
        () => summarizeContent(prompt, currentLanguage.code),
        {
          maxRetries: 3,
          initialDelay: 1000,
          onRetry: (error, attempt) => {
            console.log(`Retry attempt ${attempt} after error:`, error);
          }
        }
      ),
      // Use a cache key based on a simplified version of the prompt
      `chat_${query.slice(0, 20)}_${currentLanguage.code}_${relevantBookmarks.length}_${webResults.length}`,
      // Fallback message if everything fails
      "I'm sorry, I couldn't process your request. Please try again later."
    );

    // Fix type issue: Ensure response is a string
    const responseStr = typeof response === 'string' ? response : JSON.stringify(response);

    return {
      response: responseStr,
      bookmarks: relevantBookmarks.slice(0, 5).map((b) => ({
        title: b.title,
        url: b.url || "",
        relevance: 1,
      })),
      webResults: webResults.slice(0, 3),
    };
  } catch (error) {
    console.error("Error processing query:", error);
    throw error;
  }
};
