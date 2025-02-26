
"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProductivityScoreProps {
  score: number;
}

const ProductivityScore = ({ score }: ProductivityScoreProps) => {
  const [progress, setProgress] = useState(0);
  const isMobile = useIsMobile();

  useEffect(() => {
    const timer = setTimeout(() => setProgress(score), 500);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <Card className="p-4 md:p-6 space-y-3 w-full">
      <h3 className="text-base md:text-lg font-semibold">Productivity Score</h3>
      <div className="space-y-2">
        <Progress value={progress} className="h-2 md:h-3" />
        <div className="flex justify-between text-xs md:text-sm text-muted-foreground">
          <span>{progress}%</span>
          <span>Goal: 80%</span>
        </div>
      </div>
    </Card>
  );
};

export default ProductivityScore;
