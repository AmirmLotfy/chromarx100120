import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";
import { generateAITips } from "@/utils/analyticsUtils";
import { getHistoryData } from "@/utils/analyticsUtils";

const AITips = () => {
  const [tips, setTips] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTips = async () => {
      const startTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // Last 7 days
      const historyData = await getHistoryData(startTime);
      const generatedTips = await generateAITips(historyData);
      setTips(generatedTips);
      setLoading(false);
    };

    fetchTips();
  }, []);

  const handleRating = (tipIndex: number, isPositive: boolean) => {
    toast(isPositive ? "Glad you found this helpful!" : "Thanks for your feedback!");
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center">Generating personalized tips...</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">AI-Generated Productivity Tips</h3>
        <div className="space-y-4">
          {tips.map((tip, index) => (
            <Card key={index} className="p-4">
              <div className="flex justify-between items-start gap-4">
                <p className="flex-1">{tip}</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRating(index, true)}
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRating(index, false)}
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default AITips;