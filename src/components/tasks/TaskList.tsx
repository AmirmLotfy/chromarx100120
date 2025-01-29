import { Task } from "@/types/task";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import { Edit2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import TaskForm from "./TaskForm";
import { cn } from "@/lib/utils";

interface TaskListProps {
  tasks: Task[];
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onToggleComplete: (id: string) => void;
}

const TaskList = ({ tasks, onDelete, onEdit, onToggleComplete }: TaskListProps) => {
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-red-500/10 text-red-500";
      case "medium":
        return "bg-yellow-500/10 text-yellow-500";
      case "low":
        return "bg-green-500/10 text-green-500";
    }
  };

  return (
    <div className="space-y-4">
      {tasks.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          No tasks yet. Add your first task above!
        </div>
      ) : (
        tasks.map((task) => (
          <Card key={task.id} className={cn("w-full", task.completed && "opacity-60")}>
            <CardHeader className="pb-2">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => onToggleComplete(task.id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <CardTitle className={cn("break-words text-base sm:text-lg", task.completed && "line-through")}>
                    {task.title}
                  </CardTitle>
                  <CardDescription className="break-words mt-1 text-sm">
                    {task.description}
                  </CardDescription>
                </div>
                <div className="flex gap-1 ml-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingTask(task)}
                    className="h-8 w-8"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(task.id)}
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                <Badge variant="secondary" className="whitespace-nowrap">
                  {task.category}
                </Badge>
                <Badge className={cn("whitespace-nowrap", getPriorityColor(task.priority))}>
                  {task.priority}
                </Badge>
                <span className="text-muted-foreground whitespace-nowrap text-xs">
                  Due: {format(new Date(task.dueDate), "PPP")}
                </span>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent className="sm:max-w-lg w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <TaskForm
              initialData={editingTask}
              onSubmit={(updatedTask) => {
                onEdit({ ...updatedTask, id: editingTask.id, createdAt: editingTask.createdAt });
                setEditingTask(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskList;