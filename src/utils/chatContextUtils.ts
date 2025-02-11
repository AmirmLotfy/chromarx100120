
import { Message } from "@/types/chat";
import { Language } from "@/stores/languageStore";

export const getContextFromHistory = (messages: Message[], currentQuery: string) => {
  const recentMessages = messages.slice(-5);
  return recentMessages
    .map((msg) => `${msg.sender}: ${msg.content}`)
    .join("\n") + `\nuser: ${currentQuery}`;
};

export const generateChatPrompt = (
  query: string,
  bookmarkContext: string,
  chatContext: string,
  language: Language
) => {
  return `Based on this conversation context:
${chatContext}

And these relevant bookmarks:
${bookmarkContext}

Please provide a helpful response in ${language.name} (${language.nativeName}) that:
1. Directly addresses the latest query
2. References relevant bookmarks when applicable
3. Maintains context from the previous messages
4. Suggests related topics or follow-up questions
5. Provides concise but informative answers

Query: "${query}"`;
};

export const extractTopicsFromMessages = (messages: Message[]): string[] => {
  const topics = new Set<string>();
  messages.forEach(msg => {
    const words = msg.content
      .split(/\s+/)
      .filter(word => word.length > 4)
      .map(word => word.toLowerCase());
    words.forEach(word => topics.add(word));
  });
  return Array.from(topics);
};
