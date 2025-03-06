
import { useRef, useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, BookmarkPlus, Globe, Bot, Search, X } from "lucide-react";
import { Message } from "@/types/chat";
import { useChatState } from "@/components/chat/useChatState";
import ChatMessages from "@/components/ChatMessages";
import ChatInput from "@/components/ChatInput";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { checkGeminiAvailability } from "@/utils/geminiUtils";

const ChatPage = () => {
  const [mode, setMode] = useState<"chat" | "bookmark-search" | "web-search">("chat");
  const [isWelcome, setIsWelcome] = useState(true);
  
  // Get chat state from our hook
  const {
    messages,
    isProcessing,
    handleSendMessage,
    clearChat,
    messagesEndRef,
    activeConversation,
    isOffline,
    checkConnection,
    toggleBookmarkSearchMode,
    isBookmarkSearchMode,
  } = useChatState();

  // Check if Gemini API is available on first load
  useEffect(() => {
    const checkAPI = async () => {
      const isAvailable = await checkGeminiAvailability();
      if (!isAvailable) {
        console.warn("Gemini API not available");
      }
    };
    
    checkAPI();
    checkConnection();
  }, [checkConnection]);

  // Automatically hide welcome screen when user starts a conversation
  useEffect(() => {
    if (messages.length > 1) {
      setIsWelcome(false);
    }
  }, [messages.length]);

  const handleQuerySubmit = (query: string) => {
    if (mode === "chat") {
      // Regular chat query
      handleSendMessage(query);
    } else if (mode === "bookmark-search") {
      // Bookmark search query with special prompt
      const enhancedQuery = `Search my bookmarks for: ${query}`;
      handleSendMessage(enhancedQuery);
    } else if (mode === "web-search") {
      // Web search query with special prompt
      const enhancedQuery = `Search the web for: ${query}`;
      handleSendMessage(enhancedQuery);
    }
  };

  const changeMode = (newMode: "chat" | "bookmark-search" | "web-search") => {
    setMode(newMode);
    setIsWelcome(false);
    // Clear chat if changing modes
    if (newMode !== mode && messages.length > 1) {
      clearChat();
    }
    
    // Toggle bookmark search mode in the chat state
    if (newMode === "bookmark-search" && !isBookmarkSearchMode) {
      toggleBookmarkSearchMode();
    } else if (newMode !== "bookmark-search" && isBookmarkSearchMode) {
      toggleBookmarkSearchMode();
    }
  };

  // Render additional content for search results
  const renderSearchResults = (message: Message) => {
    if (!message.bookmarks?.length && !message.webResults?.length) return null;
    
    return (
      <div className="mt-3 pt-3 space-y-3 border-t border-primary/10">
        {message.bookmarks && message.bookmarks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-primary flex items-center gap-1.5">
              <BookmarkPlus size={14} />
              Bookmarks
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {message.bookmarks.map((bookmark, idx) => (
                <a
                  key={idx}
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-2 rounded-lg border border-primary/10 hover:bg-primary/5 transition-colors text-xs"
                >
                  <div className="font-medium line-clamp-1">{bookmark.title}</div>
                  <div className="text-xs text-muted-foreground truncate mt-1">{bookmark.url}</div>
                  {bookmark.relevanceScore && (
                    <div className="mt-1.5 flex items-center gap-1">
                      <div className="h-1 bg-primary/10 rounded-full flex-1">
                        <div 
                          className="h-1 bg-primary rounded-full"
                          style={{ width: `${Math.min(bookmark.relevanceScore * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {Math.round(bookmark.relevanceScore * 100)}%
                      </span>
                    </div>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}
        
        {message.webResults && message.webResults.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-primary flex items-center gap-1.5">
              <Globe size={14} />
              Web Results
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {message.webResults.map((result, idx) => (
                <a
                  key={idx}
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-2 rounded-lg border border-primary/10 hover:bg-primary/5 transition-colors text-xs"
                >
                  <div className="font-medium line-clamp-1">{result.title}</div>
                  <div className="text-xs text-muted-foreground truncate mt-1">{result.url}</div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-4rem)] w-full max-w-screen-sm mx-auto overflow-hidden bg-gradient-to-b from-background/80 to-background rounded-2xl shadow-md">
        {/* Main Chat Container with unified interface */}
        <div className="flex flex-col h-full">
          {/* Header with Mode Toggle */}
          <div className="flex items-center justify-between p-3 bg-background/95 backdrop-blur-sm border-b z-10">
            <div className="flex items-center gap-2">
              {activeConversation?.name ? (
                <span className="text-sm font-medium truncate max-w-[200px]">{activeConversation.name}</span>
              ) : (
                <span className="text-sm font-medium">AI Assistant</span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-muted rounded-full p-0.5">
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn(
                    "h-7 w-7 p-0 rounded-full text-xs",
                    mode === "chat" ? "bg-primary text-primary-foreground" : "hover:bg-muted-foreground/10"
                  )}
                  onClick={() => changeMode("chat")}
                >
                  <Sparkles size={14} />
                  <span className="sr-only">Chat</span>
                </Button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn(
                    "h-7 w-7 p-0 rounded-full text-xs",
                    mode === "bookmark-search" ? "bg-primary text-primary-foreground" : "hover:bg-muted-foreground/10"
                  )}
                  onClick={() => changeMode("bookmark-search")}
                >
                  <BookmarkPlus size={14} />
                  <span className="sr-only">Bookmarks</span>
                </Button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn(
                    "h-7 w-7 p-0 rounded-full text-xs",
                    mode === "web-search" ? "bg-primary text-primary-foreground" : "hover:bg-muted-foreground/10"
                  )}
                  onClick={() => changeMode("web-search")}
                >
                  <Globe size={14} />
                  <span className="sr-only">Web</span>
                </Button>
              </div>
              
              {messages.length > 1 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 rounded-full hover:bg-muted-foreground/10"
                  onClick={clearChat}
                >
                  <X size={14} />
                  <span className="sr-only">Clear</span>
                </Button>
              )}
            </div>
          </div>
          
          {/* Welcome Screen / Chat Area */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full px-3 py-3">
              <AnimatePresence mode="wait">
                {isWelcome ? (
                  <motion.div
                    key="welcome"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-full px-4 py-6 space-y-6 text-center"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        {mode === "chat" ? (
                          <Sparkles className="h-6 w-6 text-primary" />
                        ) : mode === "bookmark-search" ? (
                          <BookmarkPlus className="h-6 w-6 text-primary" />
                        ) : (
                          <Globe className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      
                      <h2 className="text-lg font-medium mt-2">
                        {mode === "chat" ? "Chat with AI" : 
                         mode === "bookmark-search" ? "Search Bookmarks" : 
                         "Search the Web"}
                      </h2>
                      
                      <p className="text-sm text-muted-foreground max-w-xs">
                        {mode === "chat" ? "Ask anything and get intelligent answers powered by AI" : 
                         mode === "bookmark-search" ? "Find content from your saved bookmarks" : 
                         "Get AI-enhanced summaries from web search"}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
                      {(mode === "chat" ? [
                        "What are the best productivity tips?",
                        "How can I learn programming quickly?",
                      ] : mode === "bookmark-search" ? [
                        "Find my productivity bookmarks",
                        "Articles about programming",
                      ] : [
                        "Latest AI developments",
                        "Healthy meal recipes",
                      ]).map((example, idx) => (
                        <Button 
                          key={idx}
                          variant="outline" 
                          size="sm"
                          className="justify-start h-auto py-2 text-xs font-normal"
                          onClick={() => handleQuerySubmit(example)}
                        >
                          {example}
                        </Button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-2"
                  >
                    <ChatMessages 
                      messages={messages} 
                      messagesEndRef={messagesEndRef}
                      renderAdditionalContent={renderSearchResults}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </ScrollArea>
          </div>
          
          {/* Input Area - Modern and Minimal */}
          <div className="p-3 bg-background/95 backdrop-blur-sm border-t mt-auto">
            <ChatInput
              onSendMessage={handleQuerySubmit}
              isProcessing={isProcessing}
              disabled={isOffline}
              placeholder={
                mode === "chat" ? "Message AI..." : 
                mode === "bookmark-search" ? "Search bookmarks..." : 
                "Search the web..."
              }
              modeIcon={
                mode === "chat" ? <Sparkles size={12} /> : 
                mode === "bookmark-search" ? <BookmarkPlus size={12} /> : 
                <Globe size={12} />
              }
              modeName={
                mode === "chat" ? "Gemini AI" : 
                mode === "bookmark-search" ? "Bookmark Search" : 
                "Web Search"
              }
              isBookmarkSearchMode={isBookmarkSearchMode}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ChatPage;
