import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import TaskForm from "@/components/tasks/TaskForm";
import TaskList from "@/components/tasks/TaskList";
import { Task } from "@/types/task";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
const TaskPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  useEffect(() => {
    const savedTasks = localStorage.getItem("tasks");
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);
  const handleAddTask = (taskData: Omit<Task, "id" | "createdAt" | "updatedAt" | "progress" | "actualDuration">) => {
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      progress: 0,
      actualDuration: 0
    };
    setTasks(prev => [...prev, newTask]);
    toast({
      title: "Task added",
      description: "Your task has been created successfully."
    });
  };
  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
    toast({
      title: "Task deleted",
      description: "Your task has been deleted."
    });
  };
  const handleEditTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(task => task.id === updatedTask.id ? {
      ...updatedTask,
      updatedAt: new Date().toISOString()
    } : task));
    toast({
      title: "Task updated",
      description: "Your task has been updated successfully."
    });
  };
  const handleToggleStatus = (id: string) => {
    setTasks(prev => prev.map(task => task.id === id ? {
      ...task,
      status: task.status === "completed" ? "pending" : "completed",
      updatedAt: new Date().toISOString()
    } : task));
  };
  const handleStartTimer = (task: Task) => {
    // Store the current task in localStorage for the timer page
    localStorage.setItem("currentTimerTask", JSON.stringify(task));
    navigate("/timer");
  };
  return <Layout>
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <div className="space-y-2 mb-8">
          <h1 className="tracking-tight text-lg font-semibold">Tasks</h1>
          <p className="text-muted-foreground">
            Manage your tasks with AI-powered prioritization
          </p>
        </div>

        <div className="space-y-8">
          <TaskForm onSubmit={handleAddTask} />
          
          <TaskList tasks={tasks} onDelete={handleDeleteTask} onEdit={handleEditTask} onStartTimer={handleStartTimer} onToggleStatus={handleToggleStatus} />
        </div>
      </div>
    </Layout>;
};
export default TaskPage;