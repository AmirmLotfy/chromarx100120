import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const ProductivityScore = () => {
  const score = 75;

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold tracking-tight">Productivity Score</h3>
        <p className="text-sm text-muted-foreground">Based on your browsing patterns</p>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-3xl font-bold text-primary">{score}%</span>
          <span className="text-sm text-muted-foreground">Good</span>
        </div>
        <Progress value={score} className="h-2" />
      </div>
    </Card>
  );
};

export default ProductivityScore;