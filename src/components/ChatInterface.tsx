
import { useEffect } from "react";
import { useChatState } from "./chat/useChatState";
import ChatInput from "./ChatInput";
import { AnimatePresence, motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import ChatHeader from "./chat/ChatHeader";
import ChatSidebar from "./chat/ChatSidebar";
import ChatMainContent from "./chat/ChatMainContent";
import { Message } from "@/types/chat";

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

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0 && markMessagesAsRead && activeConversation) {
      markMessagesAsRead();
    }
  }, [activeConversation, markMessagesAsRead]);

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
    <div className="flex flex-col h-full relative bg-gradient-to-b from-background/95 to-background overflow-hidden">
      <div className="flex flex-1 h-full relative">
        {/* Sidebar */}
        <AnimatePresence>
          {isHistoryOpen && (
            <motion.div 
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute inset-y-0 left-0 z-30 h-full w-full sm:w-80 md:w-96 md:relative"
            >
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
            </motion.div>
          )}
        </AnimatePresence>
        
        <AnimatePresence>
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
        </AnimatePresence>
        
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative max-w-full">
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
          
          <div className="sticky bottom-0 p-1 md:p-2 mt-auto bg-background/90 backdrop-blur-sm border-t border-muted/20">
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
