
import { useEffect } from "react";
import { useChatState } from "./chat/useChatState";
import ChatInput from "./ChatInput";
import { AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import ChatHeader from "./chat/ChatHeader";
import ChatSidebar from "./chat/ChatSidebar";
import ChatMainContent from "./chat/ChatMainContent";

const ChatInterface = () => {
  const {
    messages,
    isProcessing,
    error,
    isOffline,
    isAIAvailable,
    suggestions,
    isHistoryOpen,
    setIsHistoryOpen,
    chatHistory,
    messagesEndRef,
    handleSendMessage,
    clearChat,
    loadChatSession,
    retryLastMessage,
    checkConnection,
    recentQueries,
    activeConversation,
    isBookmarkSearchMode,
    toggleBookmarkSearchMode
  } = useChatState();
  
  const isMobile = useIsMobile();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Debug log to verify state changes
  useEffect(() => {
    console.log("History sidebar state:", isHistoryOpen);
  }, [isHistoryOpen]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background rounded-lg shadow-lg border">
      {/* Header */}
      <ChatHeader 
        isHistoryOpen={isHistoryOpen}
        setIsHistoryOpen={setIsHistoryOpen}
        activeConversation={activeConversation}
        messagesCount={messages.length}
        clearChat={clearChat}
        isBookmarkSearchMode={isBookmarkSearchMode}
        toggleBookmarkSearchMode={toggleBookmarkSearchMode}
      />
      
      {/* Main content area with flexible layout */}
      <div className="flex flex-1 h-full overflow-hidden relative">
        {/* Chat history sidebar */}
        <AnimatePresence>
          {isHistoryOpen && (
            <ChatSidebar 
              isHistoryOpen={isHistoryOpen}
              setIsHistoryOpen={setIsHistoryOpen}
              chatHistory={chatHistory}
              loadChatSession={loadChatSession}
              clearChat={clearChat}
              activeConversation={activeConversation}
              isMobile={isMobile}
            />
          )}
        </AnimatePresence>
        
        {/* Main chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChatMainContent 
            messages={messages}
            messagesEndRef={messagesEndRef}
            isOffline={isOffline}
            isAIAvailable={isAIAvailable}
            checkConnection={checkConnection}
            error={error}
            retryLastMessage={retryLastMessage}
            isProcessing={isProcessing}
            isBookmarkSearchMode={isBookmarkSearchMode}
          />
          
          {/* Chat input section */}
          <div className="p-3 border-t">
            <ChatInput
              onSendMessage={handleSendMessage}
              isProcessing={isProcessing}
              suggestions={suggestions}
              disabled={isOffline && !isAIAvailable}
              recentQueries={recentQueries}
              isBookmarkSearchMode={isBookmarkSearchMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
