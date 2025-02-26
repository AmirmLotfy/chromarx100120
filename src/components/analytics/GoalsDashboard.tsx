
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Productivity Goals</h2>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => (
          <Card key={goal.id} className="p-4 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium">{goal.title}</h3>
                <p className="text-sm text-muted-foreground">{goal.category}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => handleDeleteGoal(goal.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{goal.current} hours</span>
                <span>{goal.target} hours</span>
              </div>
              <Progress
                value={(goal.current / goal.target) * 100}
                className="h-2"
              />
            </div>
            
            <div className="text-xs text-muted-foreground">
              Deadline: {new Date(goal.deadline).toLocaleDateString()}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GoalsDashboard;
