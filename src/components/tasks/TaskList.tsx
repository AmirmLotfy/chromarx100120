
import { Task } from "@/types/task";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Timer, Edit2, Trash2, CheckCircle } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { toast } from "sonner";

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

  const handleStartTimer = (task: Task) => {
    if (task.status === "completed") {
      toast.error("Cannot start timer for completed task");
      return;
    }
    onStartTimer(task);
  };

  const handleToggleStatus = (task: Task) => {
    if (isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate))) {
      if (task.status !== "completed") {
        toast.error("Cannot update status of overdue task");
        return;
      }
    }
    onToggleStatus(task.id);
  };

  // Sort tasks by priority and due date
  const sortedTasks = [...tasks].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return (
    <div className="space-y-4">
      {sortedTasks.map((task) => {
        const isOverdue = isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));
        
        return (
          <div
            key={task.id}
            className={cn(
              "p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors",
              isOverdue && task.status !== "completed" && "border-red-500/50",
              task.status === "completed" && "opacity-75"
            )}
            style={{ borderLeft: `4px solid ${task.color}` }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "hover:text-primary",
                      task.status === "completed" && "text-primary"
                    )}
                    onClick={() => handleToggleStatus(task)}
                  >
                    <CheckCircle className="h-5 w-5" />
                  </Button>
                  
                  <h3 className={cn(
                    "font-semibold",
                    task.status === "completed" && "line-through"
                  )}>
                    {task.title}
                  </h3>
                  
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
                  <span className={cn(
                    isOverdue && task.status !== "completed" && "text-red-500"
                  )}>
                    Due: {format(new Date(task.dueDate), "PPP")}
                  </span>
                  <span>
                    Est. Duration: {task.estimatedDuration} minutes
                  </span>
                  {task.actualDuration > 0 && (
                    <span>
                      Actual Duration: {task.actualDuration} minutes
                    </span>
                  )}
                </div>

                <Progress 
                  value={task.progress} 
                  className="h-2"
                  indicatorClassName={cn(
                    task.status === "completed" && "bg-primary"
                  )}
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleStartTimer(task)}
                  disabled={task.status === "completed"}
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
        );
      })}
      
      {tasks.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No tasks found. Create your first task to get started!
        </div>
      )}
    </div>
  );
};

export default TaskList;
