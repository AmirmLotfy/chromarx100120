
import { useEffect } from "react";
import { useChatState } from "./chat/useChatState";
import ChatHeader from "./chat/ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import ChatError from "./chat/ChatError";
import ChatOfflineNotice from "./chat/ChatOfflineNotice";
import ConversationManager from "./chat/ConversationManager";
import { AIProgressIndicator } from "@/components/ui/ai-progress-indicator";
import BookmarkSearchMode from "./chat/BookmarkSearchMode";
import { AnimatePresence, motion } from "framer-motion";
import { History, MessageSquare } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { formatDistanceToNow } from "date-fns";

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

  const getConversationTitle = (messages) => {
    if (!messages || messages.length === 0) return "Empty conversation";
    
    const firstUserMessage = messages.find(m => m.sender === "user");
    if (firstUserMessage) {
      const content = firstUserMessage.content;
      return content.length > 30 ? content.substring(0, 30) + "..." : content;
    }
    return "Conversation";
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-gradient-to-b from-background to-background/80">
      {/* Main layout with history sidebar and chat panel */}
      <div className="flex w-full h-full gap-4">
        {/* History panel - always visible on desktop, toggleable on mobile */}
        <div 
          className={`${isHistoryOpen || !isMobile ? 'block' : 'hidden'} 
                    h-full ${isMobile ? 'w-full absolute z-50 bg-background/95' : 'w-1/4 min-w-[250px] max-w-[300px]'}`}
        >
          <div className="h-full flex flex-col border rounded-xl bg-background/60 backdrop-blur-sm shadow-md overflow-hidden">
            <div className="p-3 border-b flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                <h3 className="font-medium text-base">Chat History</h3>
              </div>
              {isMobile && (
                <button 
                  onClick={() => setIsHistoryOpen(false)}
                  className="p-1.5 hover:bg-background/80 rounded-md"
                >
                  <span className="sr-only">Close</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              )}
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {chatHistory.length > 0 ? (
                  chatHistory.map((chat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className={`flex flex-col p-3 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        activeConversation?.messages[0]?.id === chat[0]?.id
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-accent/50 border border-border/50"
                      }`}
                      onClick={() => {
                        loadChatSession(chat);
                        if (isMobile) setIsHistoryOpen(false);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageSquare className={`h-4 w-4 ${
                            activeConversation?.messages[0]?.id === chat[0]?.id
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`} />
                          <p className="font-medium text-sm truncate max-w-[180px]">
                            {getConversationTitle(chat)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground">
                          {chat[0]?.timestamp && formatDistanceToNow(new Date(chat[0].timestamp), { addSuffix: true })}
                        </p>
                        <Badge variant="outline" className="text-xs py-0">
                          {chat.length} msgs
                        </Badge>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                    <MessageSquare className="h-10 w-10 mb-2 opacity-50" />
                    <p>No chat history yet</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
        
        {/* Main chat area */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`flex flex-col ${isMobile || isHistoryOpen ? 'w-full' : 'flex-1'} h-[calc(100vh-8rem)] md:h-[75vh] overflow-hidden rounded-xl shadow-lg bg-background/40 backdrop-blur-sm border border-primary/10`}
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
            isHistoryOpen={isHistoryOpen}
            isMobile={isMobile}
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
      </div>

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
