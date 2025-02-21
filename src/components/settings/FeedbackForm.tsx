
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { MessageSquare, HelpCircle } from "lucide-react";

interface FeedbackItem {
  type: string;
  message: string;
  createdAt: string;
}

const FeedbackForm = () => {
  const [type, setType] = useState("suggestion");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setIsSubmitting(true);
    console.log("Submitting feedback:", { type, message });

    try {
      const feedback: FeedbackItem = {
        type,
        message,
        createdAt: new Date().toISOString()
      };

      // Send feedback to server instead of storing in chrome.storage
      const response = await fetch('https://chromarx.it.com/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(feedback)
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      console.log("Feedback submitted successfully");
      toast.success("Thank you for your feedback!");
      setMessage("");
      setType("suggestion");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="type">Feedback Type</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Choose the type of feedback you'd like to share</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger id="type" className="h-12 md:h-10">
            <SelectValue placeholder="Select feedback type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="suggestion">Suggestion</SelectItem>
            <SelectItem value="bug">Bug Report</SelectItem>
            <SelectItem value="question">Question</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Your Message</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Share your thoughts..."
          className="min-h-[150px] text-base md:text-sm"
        />
      </div>

      <Button
        type="submit"
        disabled={!message.trim() || isSubmitting}
        className="w-full"
      >
        <MessageSquare className="mr-2 h-4 w-4" />
        {isSubmitting ? "Submitting..." : "Submit Feedback"}
      </Button>
    </form>
  );
};

export default FeedbackForm;
