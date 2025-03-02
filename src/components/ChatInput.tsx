import React, { useState, useRef, useEffect } from "react";
import { Mic, SendHorizontal, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
  disabled?: boolean;
  recentQueries?: string[];
  isBookmarkSearchMode?: boolean;
}

interface SpeechRecognitionEvent extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult?: (event: SpeechRecognitionEvent) => void;
  onend?: () => void;
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognition;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isProcessing,
  disabled = false,
  recentQueries = [],
  isBookmarkSearchMode = false
}) => {
  const [inputValue, setInputValue] = useState("");
  const [showRecentQueries, setShowRecentQueries] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setShowRecentQueries(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      
      // Clean up speech recognition on unmount
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    
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

  const handleRecentQueryClick = (query: string) => {
    setInputValue(query);
    setShowRecentQueries(false);
    
    // Focus the input after selecting a recent query
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleClearInput = () => {
    setInputValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
  };

  const toggleSpeechRecognition = () => {
    // Check if the browser supports speech recognition
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      // Use the appropriate SpeechRecognition constructor
      const SpeechRecognitionAPI = window.SpeechRecognition || 
        (window as any).webkitSpeechRecognition;
      
      if (isListening) {
        // Stop listening
        if (recognitionRef.current) {
          recognitionRef.current.stop();
          recognitionRef.current = null;
        }
        setIsListening(false);
      } else {
        // Start listening
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');
          
          setInputValue(transcript);
          
          // Auto-resize textarea
          if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
          }
        };
        
        recognition.onend = () => {
          setIsListening(false);
        };
        
        recognition.start();
        recognitionRef.current = recognition;
        setIsListening(true);
      }
    } else {
      alert("Speech recognition is not supported in your browser.");
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
            className="absolute bottom-full left-0 right-0 mb-2 bg-background/95 backdrop-blur-sm border rounded-xl shadow-lg overflow-hidden z-10"
            ref={suggestionsRef}
          >
            <div className="p-2">
              <h3 className="text-xs font-medium text-muted-foreground px-2 py-1">Recent</h3>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {recentQueries.map((query, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted text-sm truncate"
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

      <div className="flex items-end gap-2">
        <Button
          type="button"
          onClick={toggleSpeechRecognition}
          disabled={isProcessing || disabled}
          className={cn(
            "h-10 w-10 rounded-full p-0 flex-shrink-0 transition-colors",
            isListening
              ? "bg-destructive text-destructive-foreground animate-pulse"
              : "bg-muted hover:bg-muted/80 text-muted-foreground"
          )}
          aria-label={isListening ? "Stop recording" : "Start voice input"}
        >
          <Mic className="h-4 w-4" />
        </Button>
        
        <div className="relative flex-1 overflow-hidden rounded-2xl border bg-background shadow-sm">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            placeholder={isBookmarkSearchMode ? "Search your bookmarks..." : "Message..."}
            className="w-full resize-none bg-transparent pl-4 pr-12 py-3 text-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            style={{ minHeight: "48px", maxHeight: "120px" }}
            disabled={isProcessing || disabled}
            rows={1}
          />
          
          {/* Clear input button - shows only when there's text */}
          {inputValue.trim() && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClearInput}
              className="absolute right-10 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full hover:bg-muted/80"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="sr-only">Clear input</span>
            </Button>
          )}
          
          {/* Send button inside the textarea */}
          <Button
            type="submit"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isProcessing || disabled}
            className={cn(
              "absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full p-0 flex items-center justify-center transition-all",
              (!inputValue.trim() || isProcessing || disabled) 
                ? "bg-muted text-muted-foreground"
                : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
            )}
          >
            {isBookmarkSearchMode ? (
              <Search className="h-4 w-4" />
            ) : (
              <SendHorizontal className="h-4 w-4" />
            )}
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatInput;
