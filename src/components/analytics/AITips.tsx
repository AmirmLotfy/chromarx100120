import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const AITips = () => {
  const [tips] = useState([
    {
      id: 1,
      tip: "Consider using website blockers during focused work hours to minimize distractions.",
      rating: null,
    },
    {
      id: 2,
      tip: "Try the Pomodoro Technique: 25 minutes of focused work followed by a 5-minute break.",
      rating: null,
    },
  ]);

  const handleRating = (tipId: number, isPositive: boolean) => {
    // This would update the rating in a real implementation
    toast({
      title: "Thank you for your feedback!",
      description: "Your rating helps us improve our recommendations.",
    });
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">AI-Suggested Productivity Tips</h3>
        <div className="space-y-4">
          {tips.map((tip) => (
            <Card key={tip.id} className="p-4">
              <div className="flex justify-between items-start gap-4">
                <p className="flex-1">{tip.tip}</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRating(tip.id, true)}
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRating(tip.id, false)}
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