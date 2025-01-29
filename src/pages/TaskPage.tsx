import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import TaskForm from "@/components/tasks/TaskForm";
import TaskList from "@/components/tasks/TaskList";
import { Task } from "@/types/task";
import { useToast } from "@/hooks/use-toast";
import CustomTimer from "@/components/time-management/CustomTimer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const TaskPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTaskTimer, setActiveTaskTimer] = useState<string | null>(null);
  const [showTimer, setShowTimer] = useState(false);
  const { toast } = useToast();

  // Load tasks from localStorage on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem("tasks");
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  const handleAddTask = (task: Omit<Task, "id" | "createdAt">) => {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [...prev, newTask]);
    toast({
      title: "Task added",
      description: "Your task has been created successfully.",
    });
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
    toast({
      title: "Task deleted",
      description: "Your task has been deleted.",
    });
  };

  const handleEditTask = (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );
    toast({
      title: "Task updated",
      description: "Your task has been updated successfully.",
    });
  };

  const handleToggleComplete = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleStartTimer = (taskId: string) => {
    setActiveTaskTimer(taskId);
    setShowTimer(true);
  };

  const handleTimerComplete = () => {
    if (activeTaskTimer) {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === activeTaskTimer
            ? { ...task, timeSpent: (task.timeSpent || 0) + 1500 } // Add 25 minutes (1500 seconds)
            : task
        )
      );
      setActiveTaskTimer(null);
      setShowTimer(false);
      toast({
        title: "Timer completed",
        description: "Time has been logged to your task.",
      });
    }
  };

  return (
    <Layout>
      <div className="w-full max-w-3xl mx-auto px-4 pb-20">
        <div className="space-y-2 mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Task Management</h1>
          <p className="text-muted-foreground">
            Create and manage your tasks efficiently
          </p>
        </div>
        <div className="space-y-8">
          <TaskForm onSubmit={handleAddTask} />
          <TaskList
            tasks={tasks}
            onDelete={handleDeleteTask}
            onEdit={handleEditTask}
            onToggleComplete={handleToggleComplete}
            onStartTimer={handleStartTimer}
          />
        </div>

        <Dialog open={showTimer} onOpenChange={setShowTimer}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Task Timer</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <CustomTimer
                initialMinutes={25}
                onComplete={handleTimerComplete}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default TaskPage;