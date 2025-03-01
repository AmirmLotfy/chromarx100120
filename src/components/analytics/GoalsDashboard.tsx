
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Target, Plus, Edit2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  category: string;
  deadline: string;
}

const GoalsDashboard = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoal, setNewGoal] = useState({
    title: "",
    target: 0,
    category: "",
    deadline: "",
  });

  const handleAddGoal = () => {
    if (!newGoal.title || !newGoal.target) {
      toast.error("Please fill in all required fields");
      return;
    }

    const goal: Goal = {
      id: crypto.randomUUID(),
      ...newGoal,
      current: 0,
    };

    setGoals([...goals, goal]);
    setNewGoal({ title: "", target: 0, category: "", deadline: "" });
    toast.success("Goal added successfully!");
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(goals.filter(goal => goal.id !== id));
    toast.success("Goal deleted successfully!");
  };

  return (
    <Card className="p-4 space-y-4 rounded-xl border border-border/50 bg-gradient-to-br from-background to-muted/30">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Productivity Goals</h3>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-8 rounded-full">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
              <DialogDescription>
                Set a new productivity goal to track your progress
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Goal Title</label>
                <Input
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  placeholder="e.g., Reduce social media usage"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Target (hours)</label>
                <Input
                  type="number"
                  value={newGoal.target || ""}
                  onChange={(e) => setNewGoal({ ...newGoal, target: Number(e.target.value) })}
                  placeholder="e.g., 2"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Input
                  value={newGoal.category}
                  onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                  placeholder="e.g., Productivity"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Deadline</label>
                <Input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                />
              </div>
              
              <Button onClick={handleAddGoal} className="w-full">
                Create Goal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No goals set yet</p>
          <p className="text-xs mt-1">Add goals to track your productivity progress</p>
        </div>
      ) : (
        <ScrollArea className="h-[200px] -mx-2 px-2">
          <div className="space-y-3 pb-1">
            {goals.map((goal) => (
              <div key={goal.id} className="p-3 bg-muted/20 rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-sm">{goal.title}</h4>
                    <p className="text-xs text-muted-foreground">{goal.category}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleDeleteGoal(goal.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span>{goal.current} hrs</span>
                    <span>{goal.target} hrs</span>
                  </div>
                  <Progress
                    value={(goal.current / goal.target) * 100}
                    className="h-1.5"
                  />
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Due: {new Date(goal.deadline).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
};

export default GoalsDashboard;
