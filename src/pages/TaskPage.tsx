import Layout from "@/components/Layout";
import TaskForm from "@/components/tasks/TaskForm";
import TaskList from "@/components/tasks/TaskList";
import { Task } from "@/types/task";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const TaskPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const savedTasks = localStorage.getItem("tasks");
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  const handleAddTask = (task: Omit<Task, "id" | "createdAt">) => {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [...prev, newTask]);
    toast.success("Task added successfully");
  };

  return (
    <Layout>
      <div className="space-y-6 px-4 md:px-6 pb-20 md:pb-6 pt-6 md:pt-8">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Manage your tasks and stay organized
          </p>
        </div>
        <div className="grid gap-6">
          <TaskForm onSubmit={handleAddTask} />
          <TaskList
            tasks={tasks}
            onDelete={(id) => {
              setTasks((prev) => prev.filter((task) => task.id !== id));
              toast.success("Task deleted successfully");
            }}
            onEdit={(task) => {
              setTasks((prev) =>
                prev.map((t) => (t.id === task.id ? task : t))
              );
              toast.success("Task updated successfully");
            }}
            onToggleComplete={(id) => {
              setTasks((prev) =>
                prev.map((task) =>
                  task.id === id
                    ? { ...task, completed: !task.completed }
                    : task
                )
              );
            }}
          />
        </div>
      </div>
    </Layout>
  );
};

export default TaskPage;