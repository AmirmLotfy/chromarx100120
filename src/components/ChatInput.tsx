
import React, { useState, useRef, useEffect } from "react";
import { SendHorizontal, Mic, MicOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
  disabled?: boolean;
  recentQueries?: string[];
  placeholder?: string;
  modeIcon?: React.ReactNode;
  modeName?: string;
  isBookmarkSearchMode?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isProcessing,
  disabled = false,
  recentQueries = [],
  placeholder = "Type a message...",
  modeIcon,
  modeName = "AI",
  isBookmarkSearchMode = false,
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
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 80)}px`;
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
              textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 80)}px`;
            }
          };
          
          recognition.onend = () => {
            setIsListening(false);
          };
          
          recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error', event);
            setIsListening(false);
          };
          
          recognition.start();
          recognitionRef.current = recognition;
          setIsListening(true);
        } catch (error) {
          console.error('Error initializing speech recognition:', error);
          toast.error("There was an error starting speech recognition. Please check your browser permissions.");
        }
      }
    } else {
      toast.error("Speech recognition is not supported in your browser.");
    }
  };

  return (
    <motion.div 
      className="w-full max-w-full mx-auto"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <AnimatePresence>
        {showRecentQueries && recentQueries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-0 right-0 mb-2 bg-background/95 backdrop-blur-sm border rounded-xl shadow-md overflow-hidden z-10 max-w-full mx-auto"
            ref={suggestionsRef}
          >
            <div className="p-2">
              <h3 className="text-xs font-medium text-muted-foreground px-2 py-1">Recent</h3>
              <div className="space-y-0.5 max-h-28 overflow-y-auto">
                {recentQueries.map((query, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-muted text-xs truncate"
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

      <div className="relative flex items-end gap-1.5">
        <div className="relative flex-1 overflow-hidden rounded-xl border shadow-sm bg-background/90 backdrop-blur-sm">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            className="w-full resize-none bg-transparent pl-3 pr-12 py-2.5 text-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            style={{ minHeight: "42px", maxHeight: "80px" }}
            disabled={isProcessing || disabled}
            rows={1}
          />
          
          <div className="absolute right-2 bottom-1.5 flex items-center space-x-1">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleSpeechRecognition}
              disabled={isProcessing || disabled}
              className={cn(
                "h-7 w-7 rounded-full flex-shrink-0 transition-all flex items-center justify-center",
                isListening
                  ? "text-destructive animate-pulse"
                  : "text-muted-foreground hover:bg-muted/50"
              )}
              aria-label={isListening ? "Stop recording" : "Start voice input"}
            >
              {isListening ? (
                <MicOff className="h-3.5 w-3.5" />
              ) : (
                <Mic className="h-3.5 w-3.5" />
              )}
            </motion.button>
            
            <AnimatePresence>
              {inputValue.trim() && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  type="button"
                  onClick={handleClearInput}
                  className="h-7 w-7 rounded-full hover:bg-muted/50 flex items-center justify-center"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="sr-only">Clear input</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isProcessing || disabled}
          className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all shadow-sm",
            (!inputValue.trim() || isProcessing || disabled) 
              ? "bg-muted text-muted-foreground"
              : "bg-primary text-primary-foreground"
          )}
        >
          <SendHorizontal className="h-[18px] w-[18px]" />
        </motion.button>
      </div>
      
      {/* Model indicator */}
      <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground">
        {modeIcon}
        <span>Using {modeName}</span>
      </div>
    </motion.div>
  );
};

export default ChatInput;
