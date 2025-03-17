
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import TaskForm from "@/components/tasks/TaskForm";
import TaskList from "@/components/tasks/TaskList";
import TaskTemplates from "@/components/tasks/TaskTemplates";
import TaskAnalytics from "@/components/tasks/TaskAnalytics";
import { Task, TaskPriority, TaskCategory, TaskStatus } from "@/types/task";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { localStorageClient as supabase } from "@/lib/local-storage-client";
import { 
  Plus, 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  Loader2, 
  CalendarClock,
  ListTodo
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const TaskPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("tasks");
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchTasks();
    setupRealtimeSubscription();
  }, []);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('tasks-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newTask = formatTaskFromPayload(payload.new);
            setTasks(prev => [newTask, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(task => task.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            const updatedTask = formatTaskFromPayload(payload.new);
            setTasks(prev => prev.map(task => 
              task.id === updatedTask.id ? updatedTask : task
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const formatTaskFromPayload = (data: any): Task => ({
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
  });

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

      const result = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })
        .execute();

      if (result.error) throw result.error;

      const formattedTasks: Task[] = result.data.map(task => ({
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

      const result = await supabase
        .from('tasks')
        .insert([newTask])
        .select();

      const data = result.data?.[0];
      if (!data) throw new Error('Failed to insert task');

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

  const handleUseTemplate = (templateData: Omit<Task, "id" | "createdAt" | "updatedAt" | "progress" | "actualDuration" | "status" | "dueDate">) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    handleAddTask({
      ...templateData,
      dueDate: tomorrow.toISOString(),
      status: "pending",
    });
  };

  const getCompletedTasksCount = () => {
    return tasks.filter(task => task.status === "completed").length;
  };

  const getPendingTasksCount = () => {
    return tasks.filter(task => task.status === "pending").length;
  };

  const getTodayTasksCount = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return tasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    }).length;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Loading your tasks...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-6xl mx-auto px-4 pt-4 pb-24">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Tasks</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Organize and track your productivity
            </p>
          </div>
          
          <Sheet>
            <SheetTrigger asChild>
              <button className="bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:shadow-xl transition-all">
                <Plus className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side={isMobile ? "bottom" : "right"} className="sm:max-w-lg">
              <SheetHeader className="mb-6">
                <SheetTitle>Add New Task</SheetTitle>
                <SheetDescription>
                  Create a new task to track your progress
                </SheetDescription>
              </SheetHeader>
              <div className="h-[80vh] overflow-y-auto pr-1 pb-10">
                <TaskForm onSubmit={handleAddTask} />
                <div className="mt-8 border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">Templates</h3>
                  <TaskTemplates onUseTemplate={handleUseTemplate} />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-gradient-to-br from-primary/80 to-primary rounded-xl p-4 shadow-md text-primary-foreground">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">All Tasks</h3>
              <ListTodo className="h-4 w-4 opacity-80" />
            </div>
            <p className="text-2xl font-bold mt-2">{tasks.length}</p>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-500/80 to-emerald-600 rounded-xl p-4 shadow-md text-white">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Completed</h3>
              <CheckCircle2 className="h-4 w-4 opacity-80" />
            </div>
            <p className="text-2xl font-bold mt-2">{getCompletedTasksCount()}</p>
          </div>
          
          <div className="bg-gradient-to-br from-amber-500/80 to-amber-600 rounded-xl p-4 shadow-md text-white">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Pending</h3>
              <Clock className="h-4 w-4 opacity-80" />
            </div>
            <p className="text-2xl font-bold mt-2">{getPendingTasksCount()}</p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500/80 to-blue-600 rounded-xl p-4 shadow-md text-white">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Today</h3>
              <CalendarClock className="h-4 w-4 opacity-80" />
            </div>
            <p className="text-2xl font-bold mt-2">{getTodayTasksCount()}</p>
          </div>
        </div>

        <Tabs 
          defaultValue="tasks" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid grid-cols-2 w-full bg-muted/50 rounded-lg p-1">
            <TabsTrigger 
              value="tasks"
              className={cn(
                "rounded-md transition-all",
                activeTab === "tasks" && "data-[state=active]:bg-background data-[state=active]:shadow-sm"
              )}
            >
              <ListTodo className="h-4 w-4 mr-2" />
              Tasks
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className={cn(
                "rounded-md transition-all",
                activeTab === "analytics" && "data-[state=active]:bg-background data-[state=active]:shadow-sm"
              )}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-6">
            <TaskList 
              tasks={tasks} 
              onDelete={handleDeleteTask} 
              onEdit={handleEditTask} 
              onStartTimer={handleStartTimer} 
              onToggleStatus={handleToggleStatus} 
            />
          </TabsContent>

          <TabsContent value="analytics">
            <TaskAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

// Add the missing functions from the original file
const handleDeleteTask = async (id: string) => {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .execute();

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

const handleUseTemplate = (templateData: Omit<Task, "id" | "createdAt" | "updatedAt" | "progress" | "actualDuration" | "status" | "dueDate">) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  handleAddTask({
    ...templateData,
    dueDate: tomorrow.toISOString(),
    status: "pending",
  });
};

const getCompletedTasksCount = () => {
  return tasks.filter(task => task.status === "completed").length;
};

const getPendingTasksCount = () => {
  return tasks.filter(task => task.status === "pending").length;
};

const getTodayTasksCount = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return tasks.filter(task => {
    const taskDate = new Date(task.dueDate);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === today.getTime();
  }).length;
};

export default TaskPage;
