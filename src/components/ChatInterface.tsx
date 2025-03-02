
import { useEffect } from "react";
import { useChatState } from "./chat/useChatState";
import ChatInput from "./ChatInput";
import { AnimatePresence, motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import ChatHeader from "./chat/ChatHeader";
import ChatSidebar from "./chat/ChatSidebar";
import ChatMainContent from "./chat/ChatMainContent";
import ViewToggle from "./ViewToggle";
import { useState } from "react";

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
    archivedConversations,
    showArchived,
    setShowArchived,
    messagesEndRef,
    handleSendMessage,
    clearChat,
    loadChatSession,
    retryLastMessage,
    checkConnection,
    recentQueries,
    activeConversation,
    isBookmarkSearchMode,
    toggleBookmarkSearchMode,
    markMessagesAsRead,
    archiveConversation,
    restoreConversation,
    deleteConversation,
    updateConversationCategory,
    togglePinned
  } = useChatState();
  
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <motion.div 
      className="flex flex-col h-full overflow-hidden rounded-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
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
        {/* Chat history sidebar - use AnimatePresence to handle animations */}
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
              archivedConversations={archivedConversations}
              showArchived={showArchived}
              setShowArchived={setShowArchived}
              archiveConversation={archiveConversation}
              restoreConversation={restoreConversation}
              deleteConversation={deleteConversation}
              updateConversationCategory={updateConversationCategory}
              togglePinned={togglePinned}
            />
          )}
        </AnimatePresence>
        
        {/* Overlay to close sidebar on mobile when clicking outside */}
        {isHistoryOpen && isMobile && (
          <motion.div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsHistoryOpen(false)}
            aria-hidden="true"
          />
        )}
        
        {/* Main chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!isBookmarkSearchMode && (
            <div className="px-3 pt-3 flex justify-between items-center">
              <ViewToggle view={viewMode} onViewChange={setViewMode} />
            </div>
          )}
          
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
            markMessagesAsRead={markMessagesAsRead}
            viewMode={viewMode}
          />
          
          {/* Chat input section */}
          <div className="p-3 pb-4">
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
    </motion.div>
  );
};

export default ChatInterface;
