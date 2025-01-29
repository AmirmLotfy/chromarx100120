import { Message } from "@/types/chat";

export const getContextFromHistory = (messages: Message[], currentQuery: string) => {
  // Get last 3 messages for context
  const recentMessages = messages.slice(-3);
  
  return recentMessages
    .map((msg) => `${msg.sender}: ${msg.content}`)
    .join("\n") + `\nuser: ${currentQuery}`;
};

export const generateChatPrompt = (
  query: string,
  bookmarkContext: string,
  chatContext: string
) => {
  return `Based on this conversation context:
${chatContext}

And these relevant bookmarks:
${bookmarkContext}

Please provide a helpful response that:
1. Directly addresses the latest query
2. References relevant bookmarks when applicable
3. Maintains context from the previous messages
4. Suggests related topics or follow-up questions

Query: "${query}"`;
};