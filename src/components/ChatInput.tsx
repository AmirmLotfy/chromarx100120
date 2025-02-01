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
    setOpen(value.length > 0);
  };

  return (
    <form onSubmit={handleSend} className="flex gap-2 w-full relative">
      <Popover open={open && suggestions.length > 0} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Input
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Ask me anything about your bookmarks..."
            className="flex-1 pr-24 bg-white dark:bg-accent text-foreground border-2 border-primary/20 focus:border-primary shadow-sm focus:ring-2 focus:ring-primary/20 rounded-xl h-12 text-base"
            disabled={isProcessing}
          />
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[calc(100vw-2rem)] sm:w-[500px]" align="start">
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
        className="absolute right-1 top-1 h-10 w-10 bg-primary hover:bg-primary/90"
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
};

export default ChatInput;