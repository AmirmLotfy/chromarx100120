import { Task } from "@/types/task";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Timer, Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface TaskListProps {
  tasks: Task[];
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onStartTimer: (task: Task) => void;
  onToggleStatus: (id: string) => void;
}

export const TaskList = ({
  tasks,
  onDelete,
  onEdit,
  onStartTimer,
  onToggleStatus,
}: TaskListProps) => {
  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          style={{ borderLeft: `4px solid ${task.color}` }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{task.title}</h3>
                <span
                  className={`px-2 py-0.5 text-xs rounded-full text-white ${getPriorityColor(
                    task.priority
                  )}`}
                >
                  {task.priority}
                </span>
                <span className="text-xs text-muted-foreground">
                  {task.category}
                </span>
              </div>

              {task.description && (
                <p className="text-sm text-muted-foreground">
                  {task.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Due: {format(new Date(task.dueDate), "PPP")}</span>
                <span>
                  Est. Duration: {task.estimatedDuration} minutes
                </span>
              </div>

              <Progress value={task.progress} className="h-2" />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onStartTimer(task)}
              >
                <Timer className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(task)}
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
        </div>
      ))}
    </div>
  );
};

export default TaskList;