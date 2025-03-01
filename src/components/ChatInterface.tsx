
import { useEffect } from "react";
import { useChatState } from "./chat/useChatState";
import ChatHeader from "./chat/ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import ChatSidebar from "./chat/ChatSidebar";
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
    <div className="flex h-full w-full overflow-hidden bg-gradient-to-b from-background to-background/80">
      {/* Sidebar for chat history */}
      <ChatSidebar 
        isOpen={isHistoryOpen}
        setIsOpen={setIsHistoryOpen}
        chatHistory={chatHistory}
        loadChatSession={loadChatSession}
        activeConversation={activeConversation}
      />
      
      {/* Main chat area */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col flex-1 h-[calc(100vh-8rem)] md:h-[75vh] overflow-hidden rounded-xl shadow-lg bg-background/40 backdrop-blur-sm border border-primary/10"
      >
        <ChatHeader 
          clearChat={clearChat} 
          messageCount={messages.length}
          onSaveConversation={saveConversation}
          activeConversation={activeConversation}
          onManageConversations={() => setConversationManagerOpen(true)}
          isBookmarkSearchMode={isBookmarkSearchMode}
          toggleBookmarkSearchMode={toggleBookmarkSearchMode}
          toggleHistory={() => setIsHistoryOpen(!isHistoryOpen)}
        />
        
        <div className="relative flex-1 overflow-hidden">
          <AnimatePresence>
            {isBookmarkSearchMode && (
              <BookmarkSearchMode onClose={toggleBookmarkSearchMode} />
            )}
          </AnimatePresence>
          
          {(isOffline || !isAIAvailable) && (
            <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-3">
              <ChatOfflineNotice 
                isOffline={isOffline} 
                isAIUnavailable={!isAIAvailable && !isOffline} 
                onRetryConnection={checkConnection}
              />
            </div>
          )}
          
          {error && (
            <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-3">
              <ChatError error={error} onRetry={retryLastMessage} />
            </div>
          )}
          
          {isProcessing && (
            <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-3">
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
        
        <div className="p-3 bg-background/30 backdrop-blur-sm border-t border-primary/5">
          <ChatInput
            onSendMessage={handleSendMessage}
            isProcessing={isProcessing}
            suggestions={suggestions}
            disabled={isOffline || !isAIAvailable}
            recentQueries={recentQueries}
            isBookmarkSearchMode={isBookmarkSearchMode}
          />
        </div>
      </motion.div>

      <ConversationManager
        isOpen={isConversationManagerOpen}
        setIsOpen={setConversationManagerOpen}
        conversations={chatHistory}
        activeConversation={activeConversation}
        onUpdateConversation={updateConversation}
        onLoadConversation={loadChatSession}
      />
    </div>
  );
};

export default ChatInterface;
