
import React, { useState, useRef, useEffect } from "react";
import { Search, SendHorizonal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
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
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Auto-resize textarea based on content
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  return (
    <div className="relative">
      {/* Recent Queries Dropdown */}
      <AnimatePresence>
        {showRecentQueries && recentQueries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 right-0 mb-2 bg-background border rounded-lg shadow-md overflow-hidden z-10"
            ref={suggestionsRef}
          >
            <div className="p-2">
              <h3 className="text-xs font-medium text-muted-foreground mb-2">Recent Queries</h3>
              <div className="space-y-1">
                {recentQueries.map((query, index) => (
                  <button
                    key={index}
                    className="w-full text-left p-2 rounded-md hover:bg-secondary text-sm truncate"
                    onClick={() => handleRecentQueryClick(query)}
                  >
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
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 right-0 mb-2 bg-background border rounded-lg shadow-md overflow-hidden z-10"
            ref={suggestionsRef}
          >
            <div className="p-2">
              <h3 className="text-xs font-medium text-muted-foreground mb-2">Suggestions</h3>
              <div className="space-y-1">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="w-full text-left p-2 rounded-md hover:bg-secondary text-sm"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end space-x-2">
        <div className="relative flex-1 overflow-hidden rounded-lg border bg-background">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            placeholder={isBookmarkSearchMode ? "Describe the bookmark you're looking for..." : "Type a message..."}
            className="flex w-full resize-none bg-transparent px-3 py-2 pr-10 text-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            style={{ minHeight: "40px", maxHeight: "120px" }}
            disabled={isProcessing || disabled}
            rows={1}
          />
          
          {inputValue.length > 0 && (
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-0 top-0 h-full rounded-l-none"
              onClick={() => setShowSuggestions(suggestions.length > 0)}
              disabled={suggestions.length === 0}
            >
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">Show suggestions</span>
            </Button>
          )}
        </div>
        
        <Button
          type="submit"
          size="icon"
          disabled={!inputValue.trim() || isProcessing || disabled}
          onClick={handleSendMessage}
          className={cn(
            "shrink-0 transition-opacity",
            (!inputValue.trim() || isProcessing || disabled) && "opacity-50"
          )}
        >
          {isBookmarkSearchMode ? <Search className="h-5 w-5" /> : <SendHorizonal className="h-5 w-5" />}
          <span className="sr-only">Send</span>
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;
