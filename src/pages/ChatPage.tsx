
import React, { useState, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import { useChat } from "@/hooks/useChat";
import { Message } from "@/types/chat";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bot,
  User,
  Send,
  Loader2,
  Bookmark,
  History,
  MoreVertical,
  Link2,
  Save,
  Trash,
  RefreshCcw,
  Wifi,
  WifiOff,
  Search,
  MessageSquare,
} from "lucide-react";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { getGeminiResponse } from "@/utils/geminiUtils";
import ChatHistory from "@/components/chat/ChatHistory";
import ConversationManager from "@/components/chat/ConversationManager";
import BookmarkSearchView from "@/components/chat/BookmarkSearchView";
import ChatOfflineNotice from "@/components/chat/ChatOfflineNotice";
import ChatError from "@/components/chat/ChatError";
import { useFeaturesEnabled } from "@/hooks/use-feature-access";

const ChatPage: React.FC = () => {
  const [inputValue, setInputValue] = useState("");
  const {
    messages,
    isProcessing,
    error,
    isOffline,
    isAIAvailable,
    suggestions,
    isHistoryOpen,
    isConversationManagerOpen,
    setIsHistoryOpen,
    setConversationManagerOpen,
    handleSendMessage,
    clearChat,
    retryLastMessage,
    checkConnection,
    saveConversation,
    isBookmarkSearchMode,
    toggleBookmarkSearchMode,
  } = useChat();
  const { toast } = useToast();
  const { isOffline: globalOfflineStatus } = useOfflineStatus();
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [savingConversation, setSavingConversation] = useState(false);
  const [conversationName, setConversationName] = useState("");
  const [conversationCategory, setConversationCategory] = useState("General");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const { isFeatureEnabled } = useFeaturesEnabled();

  // Auto scroll to bottom of chat when new messages come in
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [messages]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;

    await handleSendMessage(inputValue);
    setInputValue("");
  };

  // Handle suggestion click
  const handleSuggestionClick = async (suggestion: string) => {
    setInputValue(suggestion);
    await handleSendMessage(suggestion);
    setInputValue("");
  };

  // Handle saving a conversation
  const handleSaveConversation = async () => {
    if (!conversationName.trim()) {
      toast({
        title: "Error",
        description: "Please provide a name for this conversation",
        variant: "destructive",
      });
      return;
    }

    setSavingConversation(true);
    try {
      await saveConversation(conversationName, conversationCategory);
      toast({
        title: "Success",
        description: "Conversation saved successfully",
      });
      setSaveDialogOpen(false);
      setConversationName("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save conversation",
        variant: "destructive",
      });
    } finally {
      setSavingConversation(false);
    }
  };

  // Handle testing the AI model
  const testAI = async () => {
    try {
      const response = await getGeminiResponse("Hello, can you hear me?");
      console.log("AI response:", response);
      toast({
        title: "AI Test",
        description: "Connection to AI model successful",
      });
    } catch (error) {
      console.error("AI test failed:", error);
      toast({
        title: "AI Test Failed",
        description: "Could not connect to AI model",
        variant: "destructive",
      });
    }
  };

  // Check if conversation can be saved (at least 2 messages)
  const canSaveConversation = messages.length >= 2;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-6xl flex flex-col h-[calc(100vh-4rem)]">
        <div className="flex flex-row items-center justify-between mb-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">AI Assistant</h1>
            {isAIAvailable ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={checkConnection}
                className="ml-2"
              >
                <Wifi className="h-4 w-4 text-green-500" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={checkConnection}
                className="ml-2"
              >
                <WifiOff className="h-4 w-4 text-red-500" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleBookmarkSearchMode}
            >
              {isBookmarkSearchMode ? (
                <>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat Mode
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search Bookmarks
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsHistoryOpen(true)}
            >
              <History className="h-4 w-4 mr-2" />
              History
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={clearChat}>
                  <Trash className="h-4 w-4 mr-2" />
                  Clear Chat
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSaveDialogOpen(true)}
                  disabled={!canSaveConversation}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Conversation
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setConversationManagerOpen(true)}
                >
                  <Bookmark className="h-4 w-4 mr-2" />
                  Saved Conversations
                </DropdownMenuItem>
                <DropdownMenuItem onClick={testAI}>
                  <Bot className="h-4 w-4 mr-2" />
                  Test AI Connection
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Tabs defaultValue="chat" className="flex-grow flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
          </TabsList>

          <TabsContent
            value="chat"
            className="flex-grow flex flex-col h-[calc(100vh-12rem)]"
          >
            {isBookmarkSearchMode ? (
              <BookmarkSearchView />
            ) : (
              <>
                {/* Chat Container */}
                <div
                  ref={chatContainerRef}
                  className="flex-grow overflow-y-auto p-4 rounded-md border bg-background mb-4"
                >
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <Bot className="h-16 w-16 text-muted-foreground mb-4" />
                      <h3 className="text-xl font-medium mb-2">
                        How can I assist you today?
                      </h3>
                      <p className="text-muted-foreground max-w-md mb-8">
                        Ask me anything about your bookmarks, productivity, or
                        general questions. I can help you find information and
                        accomplish tasks.
                      </p>
                    </div>
                  ) : (
                    messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex mb-4 ${
                          message.sender === "user" ? "justify-end" : ""
                        }`}
                      >
                        <div
                          className={`flex gap-3 max-w-[80%] ${
                            message.sender === "user" ? "flex-row-reverse" : ""
                          }`}
                        >
                          <div
                            className={`flex items-center justify-center h-10 w-10 rounded-full shrink-0 ${
                              message.sender === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            {message.sender === "user" ? (
                              <User className="h-5 w-5" />
                            ) : (
                              <Bot className="h-5 w-5" />
                            )}
                          </div>
                          <div
                            className={`p-3 rounded-lg ${
                              message.sender === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">
                              {message.content}
                            </p>
                            {message.bookmarks &&
                              message.bookmarks.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-gray-300">
                                  <p className="text-xs font-semibold mb-1">
                                    Relevant Bookmarks:
                                  </p>
                                  <ul className="text-xs space-y-1">
                                    {message.bookmarks.map((bookmark, idx) => (
                                      <li key={idx}>
                                        <a
                                          href={bookmark.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center hover:underline"
                                        >
                                          <Link2 className="h-3 w-3 mr-1" />
                                          {bookmark.title}
                                        </a>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  {isProcessing && (
                    <div className="flex mb-4">
                      <div className="flex gap-3 max-w-[80%]">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted shrink-0">
                          <Bot className="h-5 w-5" />
                        </div>
                        <div className="p-4 rounded-lg bg-muted">
                          <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                      </div>
                    </div>
                  )}
                  {error && <ChatError error={error} onRetry={retryLastMessage} />}
                  {isOffline && <ChatOfflineNotice />}
                </div>

                {/* Input Form */}
                <form
                  onSubmit={handleSubmit}
                  className="flex items-center gap-2"
                >
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type your message..."
                    disabled={isProcessing || isOffline || !isAIAvailable}
                    className="flex-grow"
                  />
                  <Button
                    type="submit"
                    disabled={
                      !inputValue.trim() ||
                      isProcessing ||
                      isOffline ||
                      !isAIAvailable
                    }
                  >
                    {isProcessing ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </form>

                {/* Suggestions */}
                {suggestions.length > 0 && messages.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Suggested questions:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => handleSuggestionClick(suggestion)}
                          disabled={isProcessing || isOffline || !isAIAvailable}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="bookmarks" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Bookmark Integration</CardTitle>
                <CardDescription>
                  Connect your bookmarks with the AI chat
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>
                  The AI can help you find, organize, and get insights from your
                  bookmarks. You can:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Search your bookmarks with natural language</li>
                  <li>Ask for summaries of bookmarked pages</li>
                  <li>Get recommendations based on your interests</li>
                  <li>Organize bookmarks into collections</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={toggleBookmarkSearchMode}
                  className="w-full"
                  variant="outline"
                >
                  {isBookmarkSearchMode ? "Switch to Chat Mode" : "Search Bookmarks"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Conversation Dialog */}
        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Conversation</DialogTitle>
              <DialogDescription>
                Give your conversation a name to save it for later reference.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <label
                  htmlFor="name"
                  className="text-sm font-medium leading-none"
                >
                  Conversation Name
                </label>
                <Input
                  id="name"
                  value={conversationName}
                  onChange={(e) => setConversationName(e.target.value)}
                  placeholder="e.g., Research on AI Technologies"
                />
              </div>
              <div className="grid gap-2">
                <label
                  htmlFor="category"
                  className="text-sm font-medium leading-none"
                >
                  Category
                </label>
                <select
                  id="category"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={conversationCategory}
                  onChange={(e) => setConversationCategory(e.target.value)}
                >
                  <option value="General">General</option>
                  <option value="Work">Work</option>
                  <option value="Research">Research</option>
                  <option value="Personal">Personal</option>
                  <option value="Bookmarks">Bookmarks</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSaveDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveConversation}
                disabled={!conversationName.trim() || savingConversation}
              >
                {savingConversation ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Chat History Sidebar */}
        <ChatHistory
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
        />

        {/* Conversation Manager */}
        <ConversationManager
          isOpen={isConversationManagerOpen}
          onClose={() => setConversationManagerOpen(false)}
        />
      </div>
    </Layout>
  );
};

export default ChatPage;
