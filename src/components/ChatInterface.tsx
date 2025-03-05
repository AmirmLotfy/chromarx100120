
import { useEffect } from "react";
import { useChatState } from "./chat/useChatState";
import ChatInput from "./ChatInput";
import { AnimatePresence } from "framer-motion";
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
  }, [activeConversation, markMessagesAsRead, messages.length]);

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
  }, [checkConnection]);

  return (
    <div className="flex flex-col h-full relative rounded-xl shadow-lg overflow-hidden border border-primary/10 bg-gradient-to-b from-background/95 to-background">
      <div className="flex flex-1 h-full relative">
        {/* Sidebar */}
        <AnimatePresence>
          {isHistoryOpen && (
            <div className="absolute inset-y-0 left-0 z-30 h-full w-full sm:w-80 md:w-80 md:relative bg-background/95 backdrop-blur-sm">
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
            </div>
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {isHistoryOpen && isMobile && (
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20"
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
          
          <div className="p-3 mt-auto bg-background/90 backdrop-blur-sm border-t border-primary/5">
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
