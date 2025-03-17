
import React, { useEffect, useState } from 'react';
import { localStorageClient } from '@/lib/chrome-storage-client';
import TaskList from '@/components/tasks/TaskList';
import TaskForm from '@/components/tasks/TaskForm';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import TaskAnalytics from '@/components/tasks/TaskAnalytics';
import TaskTemplates from '@/components/tasks/TaskTemplates';
import { TimerSession } from '@/types/timer';
import { useToast } from '@/hooks/use-toast';

const TaskPage = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTasks();
    
    // We've removed the Supabase realtime subscription
    // Instead, we'll just poll for changes every minute
    const interval = setInterval(fetchTasks, 60000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const result = await localStorageClient
        .from('tasks')
        .select()
        .order('due_date', { ascending: true })
        .execute();

      if (result.data) {
        setTasks(result.data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTaskAdded = () => {
    setShowAddForm(false);
    fetchTasks();
  };

  const handleTaskUpdate = () => {
    fetchTasks();
  };

  const handleUseTemplate = () => {
    // Implement template usage functionality
    setShowAddForm(true);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Tasks</h1>
        <Button onClick={() => setShowAddForm(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Task
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <TaskList
            tasks={tasks}
            onTaskUpdate={handleTaskUpdate}
          />
        </div>

        <div>
          <Card className="mb-6">
            <Card className="mb-6">
              <TaskAnalytics />
            </Card>
            <TaskTemplates onUseTemplate={handleUseTemplate} />
          </Card>
        </div>
      </div>

      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <TaskForm onTaskAdded={handleTaskAdded} onCancel={() => setShowAddForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskPage;
