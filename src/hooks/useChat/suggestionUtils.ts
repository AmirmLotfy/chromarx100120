
import { Message } from "@/types/chat";
import { extractTopicsFromMessages } from "@/utils/chatContextUtils";

export const generateSuggestions = (
  messageList: Message[],
  isBookmarkSearchMode: boolean,
  setSuggestions: (suggestions: string[]) => void
) => {
  if (messageList.length === 0) return;
  
  // Generate different suggestions based on the mode
  if (isBookmarkSearchMode) {
    setSuggestions([
      "Find bookmarks about web development",
      "Look for recipe bookmarks with chicken",
      "Find bookmarks with PDF files",
      "Search for bookmarks about machine learning tutorials"
    ]);
    return;
  }
  
  const topics = extractTopicsFromMessages(messageList).slice(0, 3);
  
  // Create follow-up suggestions based on the latest conversation
  const latestUserMessage = [...messageList].reverse().find(m => m.sender === "user");
  const latestAssistantMessage = [...messageList].reverse().find(m => m.sender === "assistant");
  
  if (latestUserMessage && latestAssistantMessage) {
    let newSuggestions: string[] = [];
    
    // Add topic-based suggestions
    if (topics.length > 0) {
      newSuggestions = topics.map(topic => `Tell me more about ${topic}`);
    }
    
    // Add bookmark-related suggestions if bookmarks were mentioned
    if (latestAssistantMessage.bookmarks && latestAssistantMessage.bookmarks.length > 0) {
      newSuggestions.push(
        `Explain the first bookmark in more detail`
      );
    }
    
    // Add general follow-up questions
    if (latestUserMessage.content.toLowerCase().includes("how")) {
      newSuggestions.push("Why is this important?");
    } else if (latestUserMessage.content.toLowerCase().includes("what")) {
      newSuggestions.push("How can I apply this?");
    } else {
      newSuggestions.push("Can you summarize this topic?");
    }
    
    setSuggestions([...new Set(newSuggestions)]);
  }
};
