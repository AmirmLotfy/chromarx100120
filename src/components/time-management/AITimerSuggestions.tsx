import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Brain } from "lucide-react";
import { getGeminiApiKey } from "@/utils/firebaseUtils";
import { useFirebase } from "@/contexts/FirebaseContext";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
      const apiKey = await getGeminiApiKey(user?.uid || "");
      if (!apiKey) {
        toast({
          title: "API Key not found",
          description: "Please set up your Gemini API key in settings",
          variant: "destructive",
        });
        return;
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = `Given this task: "${task}", suggest an optimal duration in minutes for completing it. Only respond with a number representing minutes.`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const suggestedMinutes = parseInt(response.text());
      
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
    <Card className="p-6 md:p-8">
      <div className="space-y-4">
        <h3 className="text-xl font-medium">AI Timer Suggestions</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Describe your task..."
            value={task}
            onChange={(e) => setTask(e.target.value)}
            className="h-12 text-base"
          />
          <Button 
            onClick={getSuggestion} 
            disabled={loading}
            className="h-12 text-base whitespace-nowrap"
          >
            <Brain className="mr-2 h-5 w-5" />
            Get Suggestion
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default AITimerSuggestions;