import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
  suggestions: string[];
}

const ChatInput = ({ onSendMessage, isProcessing, suggestions }: ChatInputProps) => {
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);

  const handleSend = () => {
    if (!inputValue.trim() || isProcessing) return;
    onSendMessage(inputValue);
    setInputValue("");
    setOpen(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setInputValue(suggestion);
    setOpen(false);
  };

  return (
    <div className="flex gap-2">
      <Popover open={open && suggestions.length > 0} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Input
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setOpen(e.target.value.length > 0);
            }}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1"
            disabled={isProcessing}
          />
        </PopoverTrigger>
        <PopoverContent className="p-0" align="start">
          <Command>
            <CommandList>
              <CommandEmpty>No suggestions found.</CommandEmpty>
              <CommandGroup heading="Suggestions">
                {suggestions.map((suggestion, index) => (
                  <CommandItem
                    key={index}
                    onSelect={() => handleSuggestionSelect(suggestion)}
                  >
                    {suggestion}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Button onClick={handleSend} size="icon" disabled={isProcessing}>
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ChatInput;