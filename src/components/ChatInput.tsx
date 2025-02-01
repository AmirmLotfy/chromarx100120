import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Sparkles } from "lucide-react";
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

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;
    onSendMessage(inputValue);
    setInputValue("");
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    if (value.length > 0) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Close suggestions on Escape
    if (e.key === 'Escape') {
      setOpen(false);
    }
    // Allow using arrow keys to navigate suggestions when open
    if (open && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
    }
  };

  return (
    <form onSubmit={handleSend} className="flex gap-2 w-full relative">
      <Popover open={open && suggestions.length > 0} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Input
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message and press Enter to send..."
            className="flex-1 pr-24 bg-background text-foreground border border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-md h-10"
            disabled={isProcessing}
            autoFocus
          />
        </PopoverTrigger>
        <PopoverContent 
          className="p-0 w-[400px]" 
          align="start"
          sideOffset={4}
        >
          <Command>
            <CommandList>
              <CommandEmpty>No suggestions found.</CommandEmpty>
              <CommandGroup heading="Suggestions">
                {suggestions.map((suggestion, index) => (
                  <CommandItem
                    key={index}
                    onSelect={() => {
                      setInputValue(suggestion);
                      setOpen(false);
                    }}
                  >
                    <Sparkles className="h-4 w-4 mr-2 text-muted-foreground" />
                    {suggestion}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Button 
        type="submit" 
        size="icon"
        disabled={isProcessing}
        className="absolute right-1 top-1 h-8 w-8"
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
};

export default ChatInput;