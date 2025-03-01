
import { useEffect } from "react";
import { useChatState } from "./chat/useChatState";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import ChatOfflineNotice from "./chat/ChatOfflineNotice";
import { AIProgressIndicator } from "@/components/ui/ai-progress-indicator";
import { Bookmark, MessageCircle, Search, History, RefreshCw, Menu, X } from "lucide-react";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Separator } from "./ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";

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
    saveConversation,
    updateConversation,
    setConversationManagerOpen,
    isConversationManagerOpen,
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
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-violet-500/10 to-indigo-500/10">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => {
              console.log("Toggle history sidebar", !isHistoryOpen);
              setIsHistoryOpen(!isHistoryOpen);
            }}
            aria-label={isHistoryOpen ? "Close menu" : "Open menu"}
          >
            {isHistoryOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
          
          <div className="flex flex-col">
            <h1 className="text-lg font-medium">
              {activeConversation?.name || "New Chat"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {messages.length === 0 
                ? "Start a new conversation" 
                : `${messages.length} messages`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 text-xs gap-1"
            onClick={toggleBookmarkSearchMode}
          >
            {isBookmarkSearchMode ? <MessageCircle size={16} /> : <Search size={16} />}
            {isBookmarkSearchMode ? "Chat Mode" : "Search Mode"}
          </Button>
          
          {!isHistoryOpen && messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={clearChat}
              aria-label="Clear chat"
            >
              <X size={18} />
            </Button>
          )}
        </div>
      </div>
      
      {/* Main content area with flexible layout */}
      <div className="flex flex-1 h-full overflow-hidden relative">
        {/* Chat history sidebar */}
        <AnimatePresence>
          {isHistoryOpen && (
            <motion.div 
              initial={{ opacity: 0, x: isMobile ? -280 : -250 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isMobile ? -280 : -250 }}
              transition={{ duration: 0.2 }}
              className={`absolute inset-y-0 left-0 z-30 w-[70%] sm:w-[280px] bg-background border-r shadow-lg
                         ${isMobile ? 'h-full' : 'max-h-full'} flex flex-col overflow-hidden`}
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-base font-medium">Chat History</h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => {
                    console.log("Closing history sidebar");
                    setIsHistoryOpen(false);
                  }}
                >
                  <X size={18} />
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2">
                {chatHistory.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <History className="h-12 w-12 text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">No conversation history yet</p>
                  </div>
                )}
                
                {chatHistory.map((conversation) => (
                  <div 
                    key={conversation.id}
                    onClick={() => {
                      loadChatSession(conversation.messages);
                      if (isMobile) setIsHistoryOpen(false);
                    }}
                    className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors
                              ${activeConversation?.id === conversation.id 
                                ? 'bg-primary/10 border border-primary/20' 
                                : 'hover:bg-muted'}`}
                  >
                    <div className="font-medium truncate text-sm">{conversation.name}</div>
                    <div className="text-xs text-muted-foreground truncate mt-1">
                      {conversation.messages[conversation.messages.length - 1]?.content.substring(0, 50)}
                      {conversation.messages[conversation.messages.length - 1]?.content.length > 50 ? "..." : ""}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(conversation.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-3 border-t">
                <Button 
                  className="w-full text-sm h-9"
                  variant="outline"
                  onClick={() => {
                    clearChat();
                    if (isMobile) setIsHistoryOpen(false);
                  }}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  New Conversation
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Main chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Notifications section */}
          <div className="px-3 pt-2">
            {(isOffline || !isAIAvailable) && (
              <ChatOfflineNotice 
                isOffline={isOffline} 
                isAIUnavailable={!isAIAvailable && !isOffline} 
                onRetryConnection={checkConnection}
              />
            )}
            
            {error && (
              <div className="mb-3 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm">
                <div className="flex gap-2 items-start">
                  <div className="h-5 w-5 rounded-full bg-destructive/20 flex items-center justify-center mt-0.5">
                    <X size={12} className="text-destructive" />
                  </div>
                  <div>
                    <p className="font-medium text-destructive">{error.message || "Error"}</p>
                    <p className="text-xs mt-1 text-destructive/90">{error.message}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2 h-8 text-xs"
                      onClick={retryLastMessage}
                    >
                      <RefreshCw size={14} className="mr-1" /> Retry
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {isProcessing && (
              <div className="mb-3">
                <AIProgressIndicator 
                  isLoading={true} 
                  variant="minimal" 
                  message="Processing with AI..." 
                  className="bg-transparent"
                />
              </div>
            )}
          </div>
          
          {/* Chat messages section */}
          {isBookmarkSearchMode ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Bookmark className="h-8 w-8 text-primary/70" />
              </div>
              <h3 className="text-lg font-medium mb-2">Bookmark Search Mode</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Describe what you're looking for, and I'll search your bookmarks to find related content.
              </p>
            </div>
          ) : (
            <ChatMessages 
              messages={messages} 
              messagesEndRef={messagesEndRef} 
            />
          )}
          
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
