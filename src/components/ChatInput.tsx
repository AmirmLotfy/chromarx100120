
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
      
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    
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
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognitionAPI) {
      if (isListening) {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
          recognitionRef.current = null;
        }
        setIsListening(false);
      } else {
        try {
          const recognition = new SpeechRecognitionAPI();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';
          
          recognition.onresult = (event: SpeechRecognitionEvent) => {
            let transcript = '';
            
            for (let i = 0; i < event.results.length; i++) {
              if (event.results[i].isFinal) {
                transcript += event.results[i][0].transcript;
              }
            }
            
            setInputValue(transcript);
            
            if (textareaRef.current) {
              textareaRef.current.style.height = "auto";
              textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
            }
          };
          
          recognition.onend = () => {
            setIsListening(false);
          };
          
          recognition.onerror = (event) => {
            console.error('Speech recognition error', event);
            setIsListening(false);
          };
          
          recognition.start();
          recognitionRef.current = recognition;
          setIsListening(true);
        } catch (error) {
          console.error('Error initializing speech recognition:', error);
          alert("There was an error starting speech recognition. Please check your browser permissions.");
        }
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
      <AnimatePresence>
        {showRecentQueries && recentQueries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-0 right-0 mb-3 bg-background/95 backdrop-blur-sm border rounded-xl shadow-lg overflow-hidden z-10"
            ref={suggestionsRef}
          >
            <div className="p-3">
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
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={toggleSpeechRecognition}
          disabled={isProcessing || disabled}
          className={cn(
            "h-12 w-12 rounded-full p-0 flex-shrink-0 transition-colors flex items-center justify-center",
            isListening
              ? "bg-destructive text-destructive-foreground animate-pulse"
              : "bg-muted hover:bg-muted/80 text-muted-foreground"
          )}
          aria-label={isListening ? "Stop recording" : "Start voice input"}
        >
          <Mic className="h-5 w-5" />
        </motion.button>
        
        <div className="relative flex-1 overflow-hidden rounded-2xl border bg-background shadow-sm">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            placeholder={isBookmarkSearchMode ? "Search your bookmarks..." : "Message..."}
            className="w-full resize-none bg-transparent pl-4 pr-12 py-3.5 text-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            style={{ minHeight: "48px", maxHeight: "120px" }}
            disabled={isProcessing || disabled}
            rows={1}
          />
          
          <AnimatePresence>
            {inputValue.trim() && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                type="button"
                onClick={handleClearInput}
                className="absolute right-12 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hover:bg-muted/80 flex items-center justify-center"
              >
                <X className="h-4 w-4 text-muted-foreground" />
                <span className="sr-only">Clear input</span>
              </motion.button>
            )}
          </AnimatePresence>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isProcessing || disabled}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full p-0 flex items-center justify-center transition-all",
              (!inputValue.trim() || isProcessing || disabled) 
                ? "bg-muted text-muted-foreground"
                : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
            )}
          >
            {isBookmarkSearchMode ? (
              <Search className="h-5 w-5" />
            ) : (
              <SendHorizontal className="h-5 w-5" />
            )}
            <span className="sr-only">Send</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatInput;
