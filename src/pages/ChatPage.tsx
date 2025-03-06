
import { useRef, useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Sparkles, BookmarkPlus, Globe } from "lucide-react";
import { useChatState } from "@/components/chat/useChatState";
import ChatInput from "@/components/ChatInput";
import { checkGeminiAvailability } from "@/utils/geminiUtils";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatContent from "@/components/chat/ChatContent";

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

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-4rem)] w-full max-w-screen-sm mx-auto overflow-hidden bg-gradient-to-b from-background/80 to-background rounded-2xl shadow-md">
        {/* Main Chat Container with unified interface */}
        <div className="flex flex-col h-full">
          {/* Header with Mode Toggle */}
          <ChatHeader 
            activeConversation={activeConversation}
            mode={mode}
            changeMode={changeMode}
            clearChat={clearChat}
            messagesCount={messages.length}
          />
          
          {/* Welcome Screen / Chat Area */}
          <ChatContent 
            isWelcome={isWelcome}
            messages={messages}
            messagesEndRef={messagesEndRef}
            mode={mode}
            handleQuerySubmit={handleQuerySubmit}
          />
          
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
