
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Mic, X } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
  suggestions?: string[];
  disabled?: boolean;
}

const ChatInput = ({ onSendMessage, isProcessing, suggestions = [], disabled = false }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

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
    if (message.length > 1 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
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
              if (e.target.value.length > 1 && suggestions.length > 0) {
                setShowSuggestions(true);
              } else {
                setShowSuggestions(false);
              }
            }}
            onFocus={handleFocus}
            placeholder={disabled ? "Temporarily unavailable..." : "Type your message..."}
            className="pr-8"
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
          <Send className="h-4 w-4" />
        </Button>
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute bottom-full left-0 w-full mb-2 bg-background border rounded-md shadow-md z-10 max-h-[150px] overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent truncate"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatInput;
