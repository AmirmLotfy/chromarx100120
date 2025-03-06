
import React, { useState, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  Send, 
  Bookmark, 
  Sparkles, 
  X, 
  ChevronDown, 
  MessageCircle, 
  Library
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChromeBookmark } from "@/types/bookmark";
import { aiRequestManager } from "@/utils/aiRequestManager";
import { getGeminiResponse } from "@/utils/geminiUtils";
import { extractPageContent } from "@/utils/contentExtractor";
import { toast } from "sonner";

// Define types for our chat functionality
type MessageType = 'user' | 'assistant' | 'error' | 'loading';

interface ChatMessage {
  id: string;
  content: string;
  type: MessageType;
  timestamp: Date;
  bookmarks?: ChromeBookmark[];
}

type ChatMode = 'chat' | 'bookmarks' | 'search';

const ChatPage = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>('chat');
  const [selectedBookmarks, setSelectedBookmarks] = useState<ChromeBookmark[]>([]);
  const [searchResults, setSearchResults] = useState<ChromeBookmark[]>([]);
  const [showModeSelector, setShowModeSelector] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  // Scroll to bottom of chat when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Generate a unique ID for each message
  const generateId = () => {
    return Math.random().toString(36).substring(2, 9);
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const userMessage: ChatMessage = {
      id: generateId(),
      content: inputValue,
      type: 'user',
      timestamp: new Date(),
      bookmarks: selectedBookmarks.length > 0 ? selectedBookmarks : undefined,
    };
    
    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    
    // Add loading message
    const loadingId = generateId();
    setMessages(prev => [
      ...prev, 
      { 
        id: loadingId, 
        content: 'Thinking...', 
        type: 'loading', 
        timestamp: new Date() 
      }
    ]);
    
    setInputValue('');
    setIsLoading(true);
    
    try {
      let response;
      
      if (chatMode === 'chat') {
        response = await handleChatWithAI(inputValue, selectedBookmarks);
      } else if (chatMode === 'bookmarks') {
        response = await handleBookmarkSearch(inputValue);
      } else if (chatMode === 'search') {
        response = await handleWebSearch(inputValue);
      }
      
      // Remove loading message and add assistant response
      setMessages(prev => 
        prev.filter(msg => msg.id !== loadingId).concat({
          id: generateId(),
          content: response || "I couldn't find an answer to that.",
          type: 'assistant',
          timestamp: new Date()
        })
      );
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Remove loading message and add error message
      setMessages(prev => 
        prev.filter(msg => msg.id !== loadingId).concat({
          id: generateId(),
          content: "Sorry, I encountered an error processing your request.",
          type: 'error',
          timestamp: new Date()
        })
      );
      
      toast.error("Failed to process your message");
    } finally {
      setIsLoading(false);
      setSelectedBookmarks([]);
    }
  };

  // Handle chatting with AI using the Gemini API
  const handleChatWithAI = async (message: string, bookmarks: ChromeBookmark[]) => {
    try {
      // Extract content from bookmarks if they exist
      let bookmarkContent = "";
      
      if (bookmarks.length > 0) {
        const bookmarkInfos = bookmarks.map(b => `Title: ${b.title}\nURL: ${b.url || "Unknown"}`).join("\n\n");
        bookmarkContent = `\n\nRelevant bookmarks:\n${bookmarkInfos}`;
        
        // If bookmarks have URLs, try to fetch their content
        for (const bookmark of bookmarks) {
          if (bookmark.url) {
            try {
              const content = await extractPageContent(bookmark.url);
              if (content) {
                bookmarkContent += `\n\nContent from ${bookmark.title}:\n${content.substring(0, 1000)}...`;
              }
            } catch (error) {
              console.error(`Error fetching content for ${bookmark.url}:`, error);
            }
          }
        }
      }

      // Create prompt with context
      const prompt = `User question: ${message}${bookmarkContent}`;
      
      // Use Gemini API through the request manager
      const response = await aiRequestManager.makeRequest(
        async () => {
          const result = await getGeminiResponse({
            prompt,
            type: 'summarize',
            language: 'en',
            maxRetries: 1
          });
          return result.result;
        },
        `chat_${message.substring(0, 20)}_${Date.now()}`,
        "I'm sorry, I couldn't generate a response at this time."
      );
      
      return response;
    } catch (error) {
      console.error('Error in chat with AI:', error);
      throw error;
    }
  };

  // Handle searching bookmarks
  const handleBookmarkSearch = async (query: string) => {
    try {
      // This would be connected to your actual bookmark search logic
      // For now, we'll just return a placeholder
      return `Here are the bookmark search results for: "${query}"\n\nThis feature will be connected to your bookmarks database.`;
    } catch (error) {
      console.error('Error searching bookmarks:', error);
      throw error;
    }
  };

  // Handle web search
  const handleWebSearch = async (query: string) => {
    try {
      // This would be connected to Google search API
      // For now, we'll just return a placeholder
      return `Here are the web search results for: "${query}"\n\nThis feature will be connected to Google Search API.`;
    } catch (error) {
      console.error('Error performing web search:', error);
      throw error;
    }
  };

  // Handle mode selection
  const handleSelectMode = (mode: ChatMode) => {
    setChatMode(mode);
    setShowModeSelector(false);
  };

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-8rem)] max-w-md mx-auto p-2">
        {/* Chat Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-lg font-medium text-primary"
              onClick={() => setShowModeSelector(!showModeSelector)}
            >
              {chatMode === 'chat' ? 'AI Chat' : chatMode === 'bookmarks' ? 'Bookmark Search' : 'Web Search'}
              <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            {selectedBookmarks.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {selectedBookmarks.length} bookmark{selectedBookmarks.length !== 1 ? 's' : ''} selected
              </div>
            )}
          </div>
        </div>
        
        {/* Mode Selector Dropdown */}
        <AnimatePresence>
          {showModeSelector && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-background border rounded-lg shadow-lg mb-4 overflow-hidden"
            >
              <div className="p-1">
                <Button
                  variant={chatMode === 'chat' ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start mb-1"
                  onClick={() => handleSelectMode('chat')}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  AI Chat
                </Button>
                <Button
                  variant={chatMode === 'bookmarks' ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start mb-1"
                  onClick={() => handleSelectMode('bookmarks')}
                >
                  <Bookmark className="mr-2 h-4 w-4" />
                  Bookmark Search
                </Button>
                <Button
                  variant={chatMode === 'search' ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handleSelectMode('search')}
                >
                  <Search className="mr-2 h-4 w-4" />
                  Web Search
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-1 pb-2">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <div className="rounded-full bg-primary/10 p-3 mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Welcome to ChroMarx Chat</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                Ask questions about your bookmarks, search the web, or just chat with AI
              </p>
              <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
                <Button 
                  variant="outline" 
                  className="justify-start" 
                  onClick={() => setInputValue("Recommend articles based on my bookmarks")}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Recommend based on my bookmarks
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start" 
                  onClick={() => setInputValue("Summarize my bookmarks about technology")}
                >
                  <Library className="mr-2 h-4 w-4" />
                  Summarize technology bookmarks
                </Button>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex w-full px-2 py-3 rounded-lg",
                  message.type === 'user' 
                    ? "bg-primary text-primary-foreground ml-auto justify-end" 
                    : "bg-muted",
                  message.type === 'loading' && "bg-muted/50",
                  message.type === 'error' && "bg-destructive/10 text-destructive dark:text-destructive-foreground"
                )}
              >
                <div className="max-w-[80%]">
                  {message.type === 'loading' ? (
                    <div className="flex items-center space-x-2">
                      <div className="h-3 w-3 rounded-full bg-primary/20 animate-pulse"></div>
                      <div className="h-3 w-3 rounded-full bg-primary/40 animate-pulse delay-150"></div>
                      <div className="h-3 w-3 rounded-full bg-primary/60 animate-pulse delay-300"></div>
                      <span className="ml-2 text-sm">Processing your request...</span>
                    </div>
                  ) : (
                    <>
                      <div className="whitespace-pre-wrap text-sm">
                        {message.content}
                      </div>
                      
                      {message.bookmarks && message.bookmarks.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {message.bookmarks.map((bookmark) => (
                            <div 
                              key={bookmark.id} 
                              className="text-xs bg-background/30 px-2 py-1 rounded-full"
                            >
                              {bookmark.title.substring(0, 15)}
                              {bookmark.title.length > 15 ? '...' : ''}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="mt-1 text-[10px] opacity-70">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="relative bg-background rounded-lg border shadow-sm">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              chatMode === 'chat' 
                ? "Ask anything..." 
                : chatMode === 'bookmarks'
                ? "Search your bookmarks..." 
                : "Search the web..."
            }
            className="min-h-[60px] max-h-[120px] pr-10 py-3 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-2 bottom-2 h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default ChatPage;
