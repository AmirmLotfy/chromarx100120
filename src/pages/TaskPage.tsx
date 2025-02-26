
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import TaskForm from "@/components/tasks/TaskForm";
import TaskList from "@/components/tasks/TaskList";
import { Task, TaskPriority, TaskCategory, TaskStatus } from "@/types/task";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const TaskPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to manage tasks."
        });
        return;
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTasks: Task[] = data.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority as TaskPriority,
        category: task.category as TaskCategory,
        status: task.status as TaskStatus,
        dueDate: task.due_date,
        estimatedDuration: task.estimated_duration,
        actualDuration: task.actual_duration,
        color: task.color,
        progress: task.progress,
        createdAt: task.created_at,
        updatedAt: task.updated_at
      }));

      setTasks(formattedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tasks.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (taskData: Omit<Task, "id" | "createdAt" | "updatedAt" | "progress" | "actualDuration">) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newTask = {
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        category: taskData.category,
        status: 'pending' as TaskStatus,
        due_date: taskData.dueDate,
        estimated_duration: taskData.estimatedDuration,
        color: taskData.color,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select()
        .single();

      if (error) throw error;

      const formattedTask: Task = {
        id: data.id,
        title: data.title,
        description: data.description,
        priority: data.priority as TaskPriority,
        category: data.category as TaskCategory,
        status: data.status as TaskStatus,
        dueDate: data.due_date,
        estimatedDuration: data.estimated_duration,
        actualDuration: data.actual_duration,
        color: data.color,
        progress: data.progress,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      setTasks(prev => [formattedTask, ...prev]);
      toast({
        title: "Task added",
        description: "Your task has been created successfully."
      });
    } catch (error) {
      console.error('Error adding task:', error);
      toast({
        title: "Error",
        description: "Failed to add task.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTasks(prev => prev.filter(task => task.id !== id));
      toast({
        title: "Task deleted",
        description: "Your task has been deleted."
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task.",
        variant: "destructive"
      });
    }
  };

  const handleEditTask = async (updatedTask: Task) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: updatedTask.title,
          description: updatedTask.description,
          priority: updatedTask.priority,
          category: updatedTask.category,
          status: updatedTask.status,
          due_date: updatedTask.dueDate,
          estimated_duration: updatedTask.estimatedDuration,
          actual_duration: updatedTask.actualDuration,
          color: updatedTask.color,
          progress: updatedTask.progress
        })
        .eq('id', updatedTask.id);

      if (error) throw error;

      setTasks(prev => prev.map(task => 
        task.id === updatedTask.id ? {
          ...updatedTask,
          updatedAt: new Date().toISOString()
        } : task
      ));

      toast({
        title: "Task updated",
        description: "Your task has been updated successfully."
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task.",
        variant: "destructive"
      });
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (!task) return;

      const newStatus = task.status === "completed" ? "pending" as TaskStatus : "completed" as TaskStatus;
      
      const { error } = await supabase
        .from('tasks')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setTasks(prev => prev.map(task => task.id === id ? {
        ...task,
        status: newStatus,
        updatedAt: new Date().toISOString()
      } : task));
    } catch (error) {
      console.error('Error toggling task status:', error);
      toast({
        title: "Error",
        description: "Failed to update task status.",
        variant: "destructive"
      });
    }
  };

  const handleStartTimer = (task: Task) => {
    localStorage.setItem("currentTimerTask", JSON.stringify(task));
    navigate("/timer");
  };

  if (loading) {
    return (
      <Layout>
        <div className="container max-w-3xl mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading tasks...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <div className="space-y-2 mb-8">
          <h1 className="tracking-tight text-lg font-semibold">Tasks</h1>
          <p className="text-muted-foreground">
            Manage your tasks with AI-powered prioritization
          </p>
        </div>

        <div className="space-y-8">
          <TaskForm onSubmit={handleAddTask} />
          
          <TaskList 
            tasks={tasks} 
            onDelete={handleDeleteTask} 
            onEdit={handleEditTask} 
            onStartTimer={handleStartTimer} 
            onToggleStatus={handleToggleStatus} 
          />
        </div>
      </div>
    </Layout>
  );
};

export default TaskPage;
