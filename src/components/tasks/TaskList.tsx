
import { Task } from "@/types/task";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check, Clock, Edit, MoreVertical, Trash2 } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const isMobile = useIsMobile();

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

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-red-500/80";
      case "medium":
        return "bg-amber-500/80";
      case "low":
        return "bg-emerald-500/80";
      default:
        return "bg-gray-500/80";
    }
  };

  const getStatusStyles = (task: Task) => {
    const isOverdue = isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));
    
    if (task.status === "completed") {
      return "border-l-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/10";
    }
    
    if (isOverdue) {
      return "border-l-red-500 bg-red-50/50 dark:bg-red-950/10";
    }
    
    if (task.status === "in-progress") {
      return "border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/10";
    }
    
    return "border-l-primary/50 bg-card";
  };

  if (sortedTasks.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
          <Check className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium">No tasks yet</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Create your first task to get started with your productivity journey
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-20">
      {sortedTasks.map((task) => {
        const isOverdue = isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));
        
        return (
          <div
            key={task.id}
            className={cn(
              "rounded-xl border-l-4 shadow-sm overflow-hidden transition-all",
              getStatusStyles(task)
            )}
            style={{ borderLeftColor: task.color }}
          >
            <div className="p-3 sm:p-4">
              <div className="flex items-start gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "shrink-0 h-5 w-5 rounded-full border",
                    task.status === "completed" 
                      ? "bg-primary border-primary text-primary-foreground" 
                      : "border-muted-foreground/30"
                  )}
                  onClick={() => handleToggleStatus(task)}
                >
                  {task.status === "completed" && <Check className="h-3 w-3" />}
                </Button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={cn(
                      "font-medium line-clamp-2 text-sm",
                      task.status === "completed" && "line-through text-muted-foreground"
                    )}>
                      {task.title}
                    </h3>
                    
                    {isMobile ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur-sm">
                          <DropdownMenuItem onClick={() => handleStartTimer(task)}>
                            <Clock className="mr-2 h-4 w-4" />
                            Start Timer
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(task)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onDelete(task.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => handleStartTimer(task)}
                          disabled={task.status === "completed"}
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => onEdit(task)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => onDelete(task.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-1">
                    {task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-2 mt-1 mb-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full text-white ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary-foreground/80">
                        {task.category}
                      </span>
                      
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs",
                        isOverdue && task.status !== "completed" 
                          ? "bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-300" 
                          : "bg-muted text-muted-foreground"
                      )}>
                        {format(new Date(task.dueDate), "MMM d")}
                      </span>
                    </div>
                    
                    <Progress 
                      value={task.progress} 
                      className={cn(
                        "h-1.5 mt-2",
                        task.status === "completed" ? "bg-emerald-100 dark:bg-emerald-950/20" : "bg-muted"
                      )}
                      indicatorClassName={task.status === "completed" ? "bg-emerald-500" : undefined}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TaskList;
