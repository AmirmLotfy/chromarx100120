
import { useRef, useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, BookmarkPlus, Globe, Bot, Search } from "lucide-react";
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
      <div className="mt-3 space-y-3 rounded-xl bg-background/80 backdrop-blur-sm p-3 border border-primary/10">
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
      <div className="flex flex-col h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] w-full max-w-screen-sm mx-auto overflow-hidden bg-gradient-to-b from-background/80 to-background shadow-lg rounded-2xl">
        {/* Integrated Mode Toggle & Header */}
        <div className="flex items-center p-3 border-b bg-background/95 backdrop-blur-sm z-10 sticky top-0">
          <div className="flex-1 flex items-center gap-2">
            <span className="text-sm font-medium flex items-center gap-1.5">
              {mode === "chat" ? (
                <Sparkles size={16} className="text-primary" />
              ) : mode === "bookmark-search" ? (
                <BookmarkPlus size={16} className="text-primary" />
              ) : (
                <Globe size={16} className="text-primary" />
              )}
              {mode === "chat" ? "Chat" : mode === "bookmark-search" ? "Bookmarks" : "Web"}
            </span>
            {activeConversation?.name && (
              <span className="text-xs text-muted-foreground">
                {activeConversation.name}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1 bg-accent/50 rounded-full p-1">
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "h-8 w-8 p-0 rounded-full",
                mode === "chat" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
              onClick={() => changeMode("chat")}
            >
              <Sparkles size={15} />
              <span className="sr-only">Chat</span>
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "h-8 w-8 p-0 rounded-full",
                mode === "bookmark-search" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
              onClick={() => changeMode("bookmark-search")}
            >
              <BookmarkPlus size={15} />
              <span className="sr-only">Bookmarks</span>
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "h-8 w-8 p-0 rounded-full",
                mode === "web-search" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
              onClick={() => changeMode("web-search")}
            >
              <Globe size={15} />
              <span className="sr-only">Web</span>
            </Button>
          </div>
        </div>
        
        {/* Main Chat/Search Area */}
        <ScrollArea className="flex-1 pb-0">
          <AnimatePresence mode="wait">
            {isWelcome ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full text-center p-5"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  {mode === "chat" ? (
                    <Sparkles className="h-8 w-8 text-primary" />
                  ) : mode === "bookmark-search" ? (
                    <BookmarkPlus className="h-8 w-8 text-primary" />
                  ) : (
                    <Globe className="h-8 w-8 text-primary" />
                  )}
                </div>
                
                <h2 className="text-lg font-medium mb-2">
                  {mode === "chat" ? "Chat with Gemini AI" : 
                   mode === "bookmark-search" ? "Search Your Bookmarks" : 
                   "Search the Web"}
                </h2>
                
                <p className="text-sm text-muted-foreground max-w-xs mb-4">
                  {mode === "chat" ? "Ask any question and get intelligent answers powered by Gemini AI" : 
                   mode === "bookmark-search" ? "Search through your bookmarked content using natural language" : 
                   "Search the web and get AI-enhanced summaries of results"}
                </p>
                
                <div className="grid grid-cols-1 gap-2 w-full max-w-md">
                  {/* Example cards for each mode */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(mode === "chat" ? [
                      "What are the benefits of meditation?",
                      "How can I improve my productivity?",
                    ] : mode === "bookmark-search" ? [
                      "Find all my productivity bookmarks",
                      "Which tech blogs did I save?",
                    ] : [
                      "Latest news about artificial intelligence",
                      "Best places to visit in Japan",
                    ]).map((example, idx) => (
                      <Button 
                        key={idx}
                        variant="outline" 
                        size="sm"
                        className="justify-start h-auto py-2.5 px-3 text-xs font-normal"
                        onClick={() => handleQuerySubmit(example)}
                      >
                        {example}
                      </Button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="pt-2 px-3 pb-3"
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
        
        {/* Chat Input Area */}
        <div className="px-3 py-2 border-t bg-background/95 backdrop-blur-sm">
          <ChatInput
            onSendMessage={handleQuerySubmit}
            isProcessing={isProcessing}
            disabled={isOffline}
            placeholder={
              mode === "chat" ? "Ask anything..." : 
              mode === "bookmark-search" ? "Search your bookmarks..." : 
              "Search the web..."
            }
            modeIcon={
              mode === "chat" ? <Sparkles size={14} /> : 
              mode === "bookmark-search" ? <BookmarkPlus size={14} /> : 
              <Globe size={14} />
            }
            modeName={
              mode === "chat" ? "Gemini" : 
              mode === "bookmark-search" ? "Bookmarks" : 
              "Web"
            }
            isBookmarkSearchMode={isBookmarkSearchMode}
          />
        </div>
      </div>
    </Layout>
  );
};

export default ChatPage;
