
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
import { toast } from "sonner";
import { MessageSquare, Loader2 } from "lucide-react";
import { chromeDb, FeedbackItem } from "@/lib/chrome-storage";
import { motion } from "framer-motion";

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
        userId: 'guest',
        userEmail: null,
        createdAt: new Date().toISOString(),
        status: "new"
      };

      const existingFeedback = await chromeDb.get<FeedbackItem[]>('feedback') || [];
      await chromeDb.set('feedback', [...existingFeedback, feedback]);

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
    <motion.form 
      onSubmit={handleSubmit} 
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="space-y-2">
        <Label htmlFor="type" className="text-sm font-medium">Feedback Type</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger id="type" className="h-10">
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
        <Label htmlFor="message" className="text-sm font-medium">Your Message</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Share your thoughts..."
          className="min-h-[120px] text-sm resize-none"
        />
      </div>

      <Button
        type="submit"
        disabled={!message.trim() || isSubmitting}
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <MessageSquare className="mr-2 h-4 w-4" />
            Submit Feedback
          </>
        )}
      </Button>
    </motion.form>
  );
};

export default FeedbackForm;
