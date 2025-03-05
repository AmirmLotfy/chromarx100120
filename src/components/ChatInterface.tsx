
import { useEffect } from "react";
import { useChatState } from "./chat/useChatState";
import ChatInput from "./ChatInput";
import { AnimatePresence, motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import ChatHeader from "./chat/ChatHeader";
import ChatSidebar from "./chat/ChatSidebar";
import ChatMainContent from "./chat/ChatMainContent";

// Add this type to inform additional props needed by ChatMessages component
declare module "@/components/ChatMessages" {
  export interface ChatMessagesProps {
    messages: import("@/types/chat").Message[];
    messagesEndRef: React.RefObject<HTMLDivElement>;
    renderAdditionalContent?: (message: import("@/types/chat").Message) => React.ReactNode;
  }
}

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

  // Mark messages as read when viewed
  useEffect(() => {
    if (messages.length > 0 && markMessagesAsRead && activeConversation) {
      markMessagesAsRead();
    }
  }, [activeConversation, markMessagesAsRead]);

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
    checkConnection();
  }, []);

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
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
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header - more compact */}
          <ChatHeader 
            isHistoryOpen={isHistoryOpen}
            setIsHistoryOpen={setIsHistoryOpen}
            activeConversation={activeConversation}
            messagesCount={messages.length}
            clearChat={clearChat}
            isBookmarkSearchMode={isBookmarkSearchMode}
            toggleBookmarkSearchMode={toggleBookmarkSearchMode}
          />
          
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
          
          {/* Ultra compact chat input for mobile */}
          <div className="sticky bottom-0 p-1 mt-auto bg-background/95 backdrop-blur-sm">
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
