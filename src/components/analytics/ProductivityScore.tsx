
"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useIsMobile } from "@/hooks/use-mobile";
import { TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

interface ProductivityScoreProps {
  score: number;
}

const ProductivityScore = ({ score }: ProductivityScoreProps) => {
  const [progress, setProgress] = useState(0);
  const isMobile = useIsMobile();
  
  // Mock previous score for demonstration
  const previousScore = score - 5;
  const scoreChange = score - previousScore;
  const isPositive = scoreChange >= 0;

  useEffect(() => {
    const timer = setTimeout(() => setProgress(score), 500);
    return () => clearTimeout(timer);
  }, [score]);

  const getColorClass = () => {
    if (score >= 75) return "text-green-500";
    if (score >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <Card className="p-4 space-y-3 h-full rounded-xl border border-border/50 bg-gradient-to-br from-background to-muted/30">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-muted-foreground">Productivity</h3>
        <div className={`flex items-center text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {isPositive ? (
            <TrendingUp className="h-3 w-3 mr-1" />
          ) : (
            <TrendingDown className="h-3 w-3 mr-1" />
          )}
          <span>{Math.abs(scoreChange)}%</span>
        </div>
      </div>
      
      <div className="flex items-end gap-1">
        <span className={`text-2xl font-bold ${getColorClass()}`}>{progress}%</span>
        <span className="text-xs text-muted-foreground pb-1">of 100%</span>
      </div>
      
      <div className="space-y-1.5">
        <Progress value={progress} className="h-1.5" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Low</span>
          <span>Goal: 80%</span>
          <span>High</span>
        </div>
      </div>
    </Card>
  );
};

export default ProductivityScore;
