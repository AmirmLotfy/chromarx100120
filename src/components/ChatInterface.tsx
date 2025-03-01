
import { useEffect } from "react";
import { useChatState } from "./chat/useChatState";
import ChatHeader from "./chat/ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import ChatHistory from "./chat/ChatHistory";
import ChatError from "./chat/ChatError";
import ChatOfflineNotice from "./chat/ChatOfflineNotice";
import ConversationManager from "./chat/ConversationManager";
import { AIProgressIndicator } from "@/components/ui/ai-progress-indicator";
import BookmarkSearchMode from "./chat/BookmarkSearchMode";
import { AnimatePresence, motion } from "framer-motion";

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
    isMobile,
    activeConversation,
    saveConversation,
    updateConversation,
    setConversationManagerOpen,
    isConversationManagerOpen,
    isBookmarkSearchMode,
    toggleBookmarkSearchMode
  } = useChatState();

  // Auto-hide history panel on mobile when chat starts
  useEffect(() => {
    if (isMobile && messages.length > 0 && isHistoryOpen) {
      setIsHistoryOpen(false);
    }
  }, [messages.length, isMobile, isHistoryOpen, setIsHistoryOpen]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-[calc(100vh-8rem)] md:h-[75vh] bg-background rounded-xl border border-accent/40 shadow-lg overflow-hidden"
    >
      <ChatHeader 
        clearChat={clearChat} 
        messageCount={messages.length} 
        onSaveConversation={saveConversation}
        activeConversation={activeConversation}
        onManageConversations={() => setConversationManagerOpen(true)}
        isBookmarkSearchMode={isBookmarkSearchMode}
        toggleBookmarkSearchMode={toggleBookmarkSearchMode}
      />
      
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence>
          {isBookmarkSearchMode && (
            <BookmarkSearchMode onClose={toggleBookmarkSearchMode} />
          )}
        </AnimatePresence>
        
        {(isOffline || !isAIAvailable) && (
          <div className="px-4 pt-3">
            <ChatOfflineNotice 
              isOffline={isOffline} 
              isAIUnavailable={!isAIAvailable && !isOffline} 
              onRetryConnection={checkConnection}
            />
          </div>
        )}
        
        {error && (
          <div className="px-4 pt-3">
            <ChatError error={error} onRetry={retryLastMessage} />
          </div>
        )}
        
        {isProcessing && (
          <div className="px-4 pt-3">
            <AIProgressIndicator 
              isLoading={true} 
              variant="minimal" 
              message="Processing with AI..." 
              className="bg-transparent"
            />
          </div>
        )}
        
        <ChatMessages messages={messages} messagesEndRef={messagesEndRef} />
      </div>
      
      <div className="border-t p-3 bg-background/80 backdrop-blur-sm">
        <ChatInput
          onSendMessage={handleSendMessage}
          isProcessing={isProcessing}
          suggestions={suggestions}
          disabled={isOffline || !isAIAvailable}
          recentQueries={recentQueries}
          isBookmarkSearchMode={isBookmarkSearchMode}
        />
      </div>

      <ChatHistory 
        isHistoryOpen={isHistoryOpen}
        setIsHistoryOpen={setIsHistoryOpen}
        chatHistory={chatHistory}
        loadChatSession={loadChatSession}
        activeConversation={activeConversation}
      />

      <ConversationManager
        isOpen={isConversationManagerOpen}
        setIsOpen={setConversationManagerOpen}
        conversations={chatHistory}
        activeConversation={activeConversation}
        onUpdateConversation={updateConversation}
        onLoadConversation={loadChatSession}
      />
    </motion.div>
  );
};

export default ChatInterface;
