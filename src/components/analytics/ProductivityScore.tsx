import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ProductivityScoreProps {
  score: number;
}

const ProductivityScore = ({ score }: ProductivityScoreProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(score), 500);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">Productivity Score</h3>
      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{progress}%</span>
          <span>Goal: 80%</span>
        </div>
      </div>
    </Card>
  );
};

export default ProductivityScore;