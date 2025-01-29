import { useState } from "react";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { summarizeContent, translateContent } from "@/utils/geminiUtils";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface BookmarkContentProps {
  title: string;
  url: string;
}

const BookmarkContent = ({ title, url }: BookmarkContentProps) => {
  const [summary, setSummary] = useState<string>("");
  const [translation, setTranslation] = useState<string>("");
  const [targetLanguage, setTargetLanguage] = useState<string>("Spanish");
  const [isLoading, setIsLoading] = useState(false);

  const handleSummarize = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(url);
      const html = await response.text();
      // Extract text content from HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const text = tempDiv.textContent || tempDiv.innerText;
      
      const result = await summarizeContent(text);
      setSummary(result);
      toast.success("Summary generated successfully");
    } catch (error) {
      console.error('Error fetching content:', error);
      toast.error("Failed to generate summary");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (!summary) {
      toast.error("Please generate a summary first");
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await translateContent(summary, targetLanguage);
      setTranslation(result);
      toast.success("Translation generated successfully");
    } catch (error) {
      console.error('Error translating:', error);
      toast.error("Failed to translate content");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 mt-2">
      <div className="flex items-center gap-2">
        <Button 
          onClick={handleSummarize} 
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Summarize
        </Button>
        
        <Select
          value={targetLanguage}
          onValueChange={setTargetLanguage}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Spanish">Spanish</SelectItem>
            <SelectItem value="French">French</SelectItem>
            <SelectItem value="German">German</SelectItem>
            <SelectItem value="Italian">Italian</SelectItem>
            <SelectItem value="Portuguese">Portuguese</SelectItem>
          </SelectContent>
        </Select>
        
        <Button 
          onClick={handleTranslate} 
          disabled={isLoading || !summary}
          variant="outline"
          size="sm"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Translate
        </Button>
      </div>

      {summary && (
        <div className="rounded-lg bg-muted p-4">
          <h4 className="font-medium mb-2">Summary</h4>
          <p className="text-sm text-muted-foreground">{summary}</p>
        </div>
      )}

      {translation && (
        <div className="rounded-lg bg-muted p-4">
          <h4 className="font-medium mb-2">Translation ({targetLanguage})</h4>
          <p className="text-sm text-muted-foreground">{translation}</p>
        </div>
      )}
    </div>
  );
};

export default BookmarkContent;