import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const ProductivityScore = () => {
  // This would be calculated based on actual browsing data
  const score = 75;

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Productivity Score</h3>
          <span className="text-2xl font-bold text-primary">{score}%</span>
        </div>
        <Progress value={score} className="h-2" />
        <p className="text-sm text-muted-foreground">
          Your productivity score is based on your browsing patterns and time management
        </p>
      </div>
    </Card>
  );
};

export default ProductivityScore;