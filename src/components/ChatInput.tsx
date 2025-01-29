import { useState } from "react";
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

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;
    onSendMessage(inputValue);
    setInputValue("");
    setOpen(false);
  };

  return (
    <form onSubmit={handleSend} className="flex gap-2 w-full">
      <Popover open={open && suggestions.length > 0} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Input
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setOpen(e.target.value.length > 0);
            }}
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
                    onSelect={() => {
                      setInputValue(suggestion);
                      setOpen(false);
                    }}
                  >
                    {suggestion}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Button type="submit" size="icon" disabled={isProcessing}>
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
};

export default ChatInput;