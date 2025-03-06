
import React from "react";
import { Sparkles, BookmarkPlus, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface ChatWelcomeScreenProps {
  mode: "chat" | "bookmark-search" | "web-search";
  handleQuerySubmit: (query: string) => void;
}

const ChatWelcomeScreen: React.FC<ChatWelcomeScreenProps> = ({
  mode,
  handleQuerySubmit,
}) => {
  return (
    <motion.div
      key="welcome"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center h-full px-4 py-6 space-y-6 text-center"
    >
      <div className="flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          {mode === "chat" ? (
            <Sparkles className="h-6 w-6 text-primary" />
          ) : mode === "bookmark-search" ? (
            <BookmarkPlus className="h-6 w-6 text-primary" />
          ) : (
            <Globe className="h-6 w-6 text-primary" />
          )}
        </div>
        
        <h2 className="text-lg font-medium mt-2">
          {mode === "chat" ? "Chat with AI" : 
           mode === "bookmark-search" ? "Search Bookmarks" : 
           "Search the Web"}
        </h2>
        
        <p className="text-sm text-muted-foreground max-w-xs">
          {mode === "chat" ? "Ask anything and get intelligent answers powered by AI" : 
           mode === "bookmark-search" ? "Find content from your saved bookmarks" : 
           "Get AI-enhanced summaries from web search"}
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
        {(mode === "chat" ? [
          "What are the best productivity tips?",
          "How can I learn programming quickly?",
        ] : mode === "bookmark-search" ? [
          "Find my productivity bookmarks",
          "Articles about programming",
        ] : [
          "Latest AI developments",
          "Healthy meal recipes",
        ]).map((example, idx) => (
          <Button 
            key={idx}
            variant="outline" 
            size="sm"
            className="justify-start h-auto py-2 text-xs font-normal"
            onClick={() => handleQuerySubmit(example)}
          >
            {example}
          </Button>
        ))}
      </div>
    </motion.div>
  );
};

export default ChatWelcomeScreen;
