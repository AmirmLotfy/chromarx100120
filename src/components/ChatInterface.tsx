
import { useEffect } from "react";
import { useChatState } from "./chat/useChatState";
import ChatInput from "./ChatInput";
import { AnimatePresence, motion } from "framer-motion";
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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Check Gemini API availability on component mount
  useEffect(() => {
    const checkGeminiAvailability = async () => {
      try {
        const { checkGeminiAvailability } = await import('@/utils/geminiUtils');
        const isAvailable = await checkGeminiAvailability();
        if (!isAvailable) {
          console.warn('Gemini API is not available');
        }
      } catch (error) {
        console.error('Error checking Gemini availability:', error);
      }
    };
    
    checkGeminiAvailability();
  }, []);

  return (
    <div className="flex flex-col h-full relative">
      {/* Main content area with sidebar */}
      <div className="flex flex-1 h-full relative">
        {/* Chat history sidebar with animations */}
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
        
        {/* Overlay to close sidebar on mobile */}
        <AnimatePresence>
          {isHistoryOpen && isMobile && (
            <motion.div 
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryOpen(false)}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>
        
        {/* Main chat area */}
        <div className="flex-1 flex flex-col h-full">
          {/* Header - fixed position to ensure it's always visible */}
          <div className="sticky top-0 z-10 w-full">
            <ChatHeader 
              isHistoryOpen={isHistoryOpen}
              setIsHistoryOpen={setIsHistoryOpen}
              activeConversation={activeConversation}
              messagesCount={messages.length}
              clearChat={clearChat}
              isBookmarkSearchMode={isBookmarkSearchMode}
              toggleBookmarkSearchMode={toggleBookmarkSearchMode}
            />
          </div>
          
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
          />
          
          {/* Chat input section */}
          <div className="sticky bottom-0 p-2 mt-auto bg-background/95 backdrop-blur-sm">
            <ChatInput
              onSendMessage={handleSendMessage}
              isProcessing={isProcessing}
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
