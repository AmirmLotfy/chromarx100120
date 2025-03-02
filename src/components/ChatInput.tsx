
import React, { useState, useRef, useEffect } from "react";
import { Search, SendHorizontal, Sparkles, X, Mic, Image, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
  suggestions?: string[];
  disabled?: boolean;
  recentQueries?: string[];
  isBookmarkSearchMode?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isProcessing,
  suggestions = [],
  disabled = false,
  recentQueries = [],
  isBookmarkSearchMode = false
}) => {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showRecentQueries, setShowRecentQueries] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setShowRecentQueries(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (e.target.value === "") {
      setShowSuggestions(false);
    }
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleInputFocus = () => {
    if (recentQueries.length > 0 && inputValue === "") {
      setShowRecentQueries(true);
    }
  };

  const handleSendMessage = () => {
    if (inputValue.trim() && !isProcessing && !disabled) {
      onSendMessage(inputValue.trim());
      setInputValue("");
      setShowSuggestions(false);
      setShowRecentQueries(false);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSendMessage(suggestion);
    setInputValue("");
    setShowSuggestions(false);
  };

  const handleRecentQueryClick = (query: string) => {
    setInputValue(query);
    setShowRecentQueries(false);
    
    // Focus the input after selecting a recent query
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <motion.div 
      className="relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      {/* Recent Queries Dropdown */}
      <AnimatePresence>
        {showRecentQueries && recentQueries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-0 right-0 mb-2 bg-background border rounded-xl shadow-lg overflow-hidden z-10"
            ref={suggestionsRef}
          >
            <div className="p-2">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-medium text-muted-foreground">Recent Queries</h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={() => setShowRecentQueries(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {recentQueries.map((query, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted text-sm truncate flex items-center"
                    onClick={() => handleRecentQueryClick(query)}
                  >
                    <span className="h-5 w-5 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                      <Sparkles className="h-3 w-3 text-primary/70" />
                    </span>
                    {query}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-0 right-0 mb-2 bg-background border rounded-xl shadow-lg overflow-hidden z-10"
            ref={suggestionsRef}
          >
            <div className="p-2">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-medium text-muted-foreground">Suggestions</h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={() => setShowSuggestions(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted text-sm flex items-center"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <span className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center mr-2 flex-shrink-0">
                      <Sparkles className="h-3 w-3 text-primary/70" />
                    </span>
                    <span className="line-clamp-2">{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-2">
        <div className="relative flex-1 overflow-hidden rounded-2xl border bg-background shadow-sm">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            placeholder={isBookmarkSearchMode ? "Search your bookmarks..." : "Type a message..."}
            className="w-full resize-none bg-transparent px-4 py-3 pr-12 text-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            style={{ minHeight: "44px", maxHeight: "120px" }}
            disabled={isProcessing || disabled}
            rows={1}
          />
          
          <div className="absolute right-2 bottom-2 flex items-center">
            {!isBookmarkSearchMode && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full hover:bg-muted"
                  disabled={isProcessing || disabled}
                >
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  <span className="sr-only">Attach file</span>
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full hover:bg-muted"
                  disabled={isProcessing || disabled}
                >
                  <Image className="h-4 w-4 text-muted-foreground" />
                  <span className="sr-only">Add image</span>
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full hover:bg-muted"
                  disabled={isProcessing || disabled}
                >
                  <Mic className="h-4 w-4 text-muted-foreground" />
                  <span className="sr-only">Voice input</span>
                </Button>
              </>
            )}
            
            {inputValue.length > 0 && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full hover:bg-muted"
                onClick={() => setShowSuggestions(suggestions.length > 0)}
                disabled={suggestions.length === 0 || isProcessing || disabled}
              >
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                <span className="sr-only">Show suggestions</span>
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button
            type="submit"
            size="icon"
            disabled={!inputValue.trim() || isProcessing || disabled}
            onClick={handleSendMessage}
            className={cn(
              "h-10 w-10 rounded-full transition-all",
              (!inputValue.trim() || isProcessing || disabled) 
                ? "opacity-50" 
                : "bg-primary hover:bg-primary/90 shadow-md"
            )}
          >
            {isBookmarkSearchMode ? (
              <Search className="h-5 w-5" />
            ) : (
              <SendHorizontal className="h-5 w-5" />
            )}
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatInput;
