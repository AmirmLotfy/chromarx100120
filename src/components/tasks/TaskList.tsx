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
          <Card key={task.id} className={cn(task.completed && "opacity-60")}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => onToggleComplete(task.id)}
                  />
                  <div>
                    <CardTitle className={cn(task.completed && "line-through")}>
                      {task.title}
                    </CardTitle>
                    <CardDescription>{task.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingTask(task)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(task.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 text-sm">
                <Badge variant="secondary">{task.category}</Badge>
                <Badge className={getPriorityColor(task.priority)}>
                  {task.priority}
                </Badge>
                <span className="text-muted-foreground">
                  Due: {format(new Date(task.dueDate), "PPP")}
                </span>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent>
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