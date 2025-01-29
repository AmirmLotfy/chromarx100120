import { useState } from "react";
import Layout from "@/components/Layout";
import TaskForm from "@/components/tasks/TaskForm";
import TaskList from "@/components/tasks/TaskList";
import { Task } from "@/types/task";

const TaskPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);

  const handleAddTask = (task: Omit<Task, "id" | "createdAt">) => {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [...prev, newTask]);
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const handleEditTask = (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );
  };

  const handleToggleComplete = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Task Management</h1>
          <p className="text-muted-foreground">
            Create and manage your tasks efficiently
          </p>
        </div>
        <TaskForm onSubmit={handleAddTask} />
        <TaskList
          tasks={tasks}
          onDelete={handleDeleteTask}
          onEdit={handleEditTask}
          onToggleComplete={handleToggleComplete}
        />
      </div>
    </Layout>
  );
};

export default TaskPage;