import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Brain } from "lucide-react";
import { useFirebase } from "@/contexts/FirebaseContext";

const AITimerSuggestions = ({ onSuggestion }: { onSuggestion: (duration: number) => void }) => {
  const [task, setTask] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useFirebase();

  const getSuggestion = async () => {
    if (!task) {
      toast({
        title: "Please enter a task description",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const token = await user?.getIdToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('YOUR_CLOUD_FUNCTION_URL/getGeminiResponse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: task,
          type: 'timer',
          language: 'en',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get suggestion');
      }

      const data = await response.json();
      const suggestedMinutes = parseInt(data.result);
      
      if (!isNaN(suggestedMinutes) && suggestedMinutes > 0) {
        onSuggestion(suggestedMinutes);
        toast({
          title: "AI Suggestion",
          description: `Recommended duration: ${suggestedMinutes} minutes`,
        });
      }
    } catch (error) {
      toast({
        title: "Error getting suggestion",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-1.5">
        <Brain className="h-4 w-4" />
        <h3 className="text-base font-medium">AI Timer Suggestions</h3>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Describe your task..."
          value={task}
          onChange={(e) => setTask(e.target.value)}
          className="h-10 text-sm flex-1"
        />
        <Button 
          onClick={getSuggestion} 
          disabled={loading}
          className="h-10 text-sm whitespace-nowrap"
        >
          <Brain className="mr-1.5 h-4 w-4" />
          Get Suggestion
        </Button>
      </div>
    </div>
  );
};

export default AITimerSuggestions;