
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Target, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Achievement {
  id: string;
  title: string;
  description: string;
  progress: number;
  type: 'daily' | 'weekly' | 'monthly' | 'special';
  icon: 'trophy' | 'star' | 'target' | 'clock';
}

interface AchievementCardProps {
  achievement: Achievement;
}

const icons = {
  trophy: Trophy,
  star: Star,
  target: Target,
  clock: Clock,
};

const AchievementCard = ({ achievement }: AchievementCardProps) => {
  const Icon = icons[achievement.icon];
  
  return (
    <Card className={cn(
      "p-4 transition-all duration-300",
      achievement.progress >= 100 ? "bg-primary/10" : ""
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2 rounded-lg",
          achievement.progress >= 100 ? "bg-primary/20" : "bg-muted"
        )}>
          <Icon className={cn(
            "w-5 h-5",
            achievement.progress >= 100 ? "text-primary" : "text-muted-foreground"
          )} />
        </div>
        
        <div className="flex-1 space-y-2">
          <div>
            <h4 className="text-sm font-medium">{achievement.title}</h4>
            <p className="text-xs text-muted-foreground">{achievement.description}</p>
          </div>
          
          <div className="space-y-1">
            <Progress value={achievement.progress} className="h-1" />
            <span className="text-xs text-muted-foreground">
              {achievement.progress}% Complete
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AchievementCard;
