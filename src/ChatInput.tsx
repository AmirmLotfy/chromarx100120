
import React, { useState, useRef, useEffect } from "react";
import { Mic, SendHorizontal, Search, X, MicOff, Globe, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

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
      className="relative max-w-xl mx-auto w-full"
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
            className="absolute bottom-full left-0 right-0 mb-2 bg-background/95 backdrop-blur-sm border rounded-xl shadow-lg overflow-hidden z-10"
            ref={suggestionsRef}
          >
            <div className="p-2">
              <h3 className="text-xs font-medium text-muted-foreground px-2 py-1">Recent</h3>
              <div className="space-y-0.5 max-h-36 overflow-y-auto">
                {recentQueries.map((query, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted text-xs truncate"
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

      <div className="relative">
        <div className="flex items-end gap-1.5">
          <div className="relative flex-1 overflow-hidden rounded-xl border shadow-sm bg-background">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              placeholder={isBookmarkSearchMode ? "Search your bookmarks and the web..." : "Message..."}
              className="w-full resize-none bg-transparent pl-3 pr-14 py-3 text-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              style={{ minHeight: "44px", maxHeight: "120px" }}
              disabled={isProcessing || disabled}
              rows={1}
            />
            
            <div className="absolute bottom-0 right-0 flex items-center pr-2 py-1.5 space-x-1">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={toggleSpeechRecognition}
                disabled={isProcessing || disabled}
                className={cn(
                  "h-8 w-8 rounded-full flex-shrink-0 transition-all flex items-center justify-center",
                  isListening
                    ? "text-destructive animate-pulse"
                    : "text-muted-foreground hover:bg-muted/50"
                )}
                aria-label={isListening ? "Stop recording" : "Start voice input"}
              >
                {isListening ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
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
                    className="h-8 w-8 rounded-full hover:bg-muted/50 flex items-center justify-center"
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
                  "h-9 w-9 rounded-full p-0 flex items-center justify-center transition-all",
                  (!inputValue.trim() || isProcessing || disabled) 
                    ? "text-muted-foreground"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                {isBookmarkSearchMode ? (
                  <Search className="h-4 w-4" />
                ) : (
                  <SendHorizontal className="h-4 w-4" />
                )}
                <span className="sr-only">Send</span>
              </motion.button>
            </div>
          </div>
        </div>
        
        {/* Model indicator pill */}
        <AnimatePresence>
          {!isProcessing && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute left-2 bottom-0.5 transform translate-y-full"
            >
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground py-0.5 px-1.5 rounded-full">
                {isBookmarkSearchMode ? 
                  <>
                    <Globe className="h-2.5 w-2.5" />
                    <span>Search</span>
                  </> : 
                  <>
                    <Sparkles className="h-2.5 w-2.5" />
                    <span>Gemini</span>
                  </>
                }
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ChatInput;
