
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Mic, X, MessageSquarePlus, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
  suggestions?: string[];
  disabled?: boolean;
  recentQueries?: string[];
}

const ChatInput = ({ 
  onSendMessage, 
  isProcessing, 
  suggestions = [], 
  disabled = false,
  recentQueries = []
}: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Simulate loading suggestions when the input changes (replace with actual logic)
  useEffect(() => {
    if (message.length > 1) {
      setIsLoadingSuggestions(true);
      const timer = setTimeout(() => {
        setIsLoadingSuggestions(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isProcessing || disabled) return;
    
    onSendMessage(message);
    setMessage("");
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Toggle suggestions based on input focus and content
  const handleFocus = () => {
    setInputFocused(true);
    if (message.length > 1 && (suggestions.length > 0 || recentQueries.length > 0)) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    setInputFocused(false);
    // Delay hiding suggestions to allow time for clicks
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(document.activeElement)) {
        setShowSuggestions(false);
      }
    }, 150);
  };

  const handleClearInput = () => {
    setMessage("");
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (e.target.value.length > 1 && (suggestions.length > 0 || recentQueries.length > 0)) {
                setShowSuggestions(true);
              } else {
                setShowSuggestions(false);
              }
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={disabled ? "Temporarily unavailable..." : "Type your message..."}
            className={`pr-8 transition-all ${inputFocused ? 'ring-2 ring-primary/20' : ''}`}
            disabled={isProcessing || disabled}
            autoFocus
          />
          {message && (
            <button
              type="button"
              onClick={handleClearInput}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button 
          type="submit"
          size="icon"
          disabled={isProcessing || !message.trim() || disabled}
          className="shrink-0"
        >
          <Send className={`h-4 w-4 ${isProcessing ? 'opacity-70' : ''}`} />
        </Button>
      </form>

      {showSuggestions && (suggestions.length > 0 || recentQueries.length > 0 || isLoadingSuggestions) && (
        <div 
          ref={suggestionsRef}
          className="absolute bottom-full left-0 w-full mb-2 bg-background border rounded-md shadow-md z-10 max-h-[200px] overflow-y-auto"
        >
          {isLoadingSuggestions ? (
            <div className="p-2 space-y-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-6 w-5/6" />
            </div>
          ) : (
            <>
              {recentQueries.length > 0 && (
                <div className="pt-1">
                  <p className="px-3 py-1 text-xs text-muted-foreground font-medium">Recent Queries</p>
                  {recentQueries.map((query, index) => (
                    <button
                      key={`recent-${index}`}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent truncate flex items-center"
                      onClick={() => handleSuggestionClick(query)}
                    >
                      <MessageSquarePlus className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                      {query}
                    </button>
                  ))}
                </div>
              )}
              
              {suggestions.length > 0 && (
                <div className={recentQueries.length > 0 ? "border-t pt-1" : "pt-1"}>
                  <p className="px-3 py-1 text-xs text-muted-foreground font-medium">Suggestions</p>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={`suggestion-${index}`}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent truncate flex items-center"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatInput;
