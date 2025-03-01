
import { useEffect } from "react";
import { useChatState } from "./chat/useChatState";
import ChatHeader from "./chat/ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import ChatHistory from "./chat/ChatHistory";
import ChatError from "./chat/ChatError";
import ChatOfflineNotice from "./chat/ChatOfflineNotice";
import { AIProgressIndicator } from "@/components/ui/ai-progress-indicator";
import { Skeleton } from "@/components/ui/skeleton";

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
    isMobile
  } = useChatState();

  // Auto-hide history panel on mobile when chat starts
  useEffect(() => {
    if (isMobile && messages.length > 0 && isHistoryOpen) {
      setIsHistoryOpen(false);
    }
  }, [messages.length, isMobile, isHistoryOpen, setIsHistoryOpen]);

  return (
    <div className="flex flex-col h-[calc(100dvh-12rem)] md:h-[600px] bg-background border rounded-lg shadow-sm">
      <ChatHeader clearChat={clearChat} messageCount={messages.length} />
      
      <div className="flex-1 overflow-hidden flex flex-col">
        {(isOffline || !isAIAvailable) && (
          <div className="px-4 pt-3">
            <ChatOfflineNotice 
              isOffline={isOffline} 
              isAIUnavailable={!isAIAvailable && !isOffline} 
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
      
      <div className="border-t p-3">
        <ChatInput
          onSendMessage={handleSendMessage}
          isProcessing={isProcessing}
          suggestions={suggestions}
          disabled={isOffline && !isAIAvailable}
        />
      </div>

      <ChatHistory 
        isHistoryOpen={isHistoryOpen}
        setIsHistoryOpen={setIsHistoryOpen}
        chatHistory={chatHistory}
        loadChatSession={loadChatSession}
      />
    </div>
  );
};

export default ChatInterface;
