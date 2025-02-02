import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { getHistoryData } from "@/utils/analyticsUtils";
import { getGeminiResponse } from "@/utils/geminiUtils";

const AITips = () => {
  const [tips, setTips] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTips = async () => {
      try {
        const startTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // Last 7 days
        const historyData = await getHistoryData(startTime);
        
        // Format history data for Gemini
        const historyContext = historyData
          .map(visit => `${visit.domain}: ${visit.visitCount} visits, ${Math.round(visit.timeSpent)} minutes`)
          .join('\n');

        const prompt = `Based on this user's browsing history:\n${historyContext}\n\nProvide 3 specific, actionable productivity tips. Focus on time management and effective browsing habits.`;
        
        const response = await getGeminiResponse({
          prompt,
          type: 'summarize',
          language: 'en',
          contentType: 'productivity'
        });

        // Split response into individual tips
        const generatedTips = response.result.split('\n').filter(tip => tip.trim());
        setTips(generatedTips);
      } catch (error) {
        console.error('Error generating AI tips:', error);
        toast.error('Failed to generate productivity tips');
      } finally {
        setLoading(false);
      }
    };

    fetchTips();
  }, []);

  const handleRating = (tipIndex: number, isPositive: boolean) => {
    toast(isPositive ? "Thanks for your feedback!" : "We'll improve our suggestions");
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <HelpCircle className="w-5 h-5 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">AI-Powered Productivity Tips</h3>
            <p className="text-sm text-muted-foreground">Personalized suggestions based on your browsing patterns</p>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">
              Analyzing your browsing patterns...
            </div>
          ) : (
            tips.map((tip, index) => (
              <Card key={index} className="p-4 bg-muted/50">
                <div className="flex justify-between items-start gap-4">
                  <p className="flex-1 text-sm">{tip}</p>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRating(index, true)}
                      className="text-green-600 hover:text-green-700 hover:bg-green-100"
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRating(index, false)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-100"
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </Card>
  );
};

export default AITips;