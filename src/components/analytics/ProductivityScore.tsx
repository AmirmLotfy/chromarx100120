import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getHistoryData, calculateProductivityScore } from "@/utils/analyticsUtils";
import { VisitData } from "@/types/analytics";

const ProductivityScore = () => {
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Get data from last 7 days
      const startTime = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const visits = await getHistoryData(startTime);
      const calculatedScore = calculateProductivityScore(visits);
      setScore(calculatedScore);
      setLoading(false);
    };

    fetchData();
  }, []);

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Improvement";
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold tracking-tight">Productivity Score</h3>
        <p className="text-sm text-muted-foreground">Based on your actual browsing patterns</p>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-3xl font-bold text-primary">
            {loading ? "..." : `${score}%`}
          </span>
          <span className="text-sm text-muted-foreground">
            {loading ? "Calculating..." : getScoreLabel(score)}
          </span>
        </div>
        <Progress value={score} className="h-2" />
      </div>
    </Card>
  );
};

export default ProductivityScore;