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
  const [timerSessions, setTimerSessions] = useState<TimerSession[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchTasks();
    fetchTimerSessions();
    
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

  const fetchTimerSessions = async () => {
    try {
      const result = await localStorageClient
        .from('timer_sessions')
        .select()
        .order('created_at', { ascending: false })
        .execute();

      if (result.data) {
        setTimerSessions(result.data.map((session: any) => ({
          id: session.id,
          userId: session.user_id,
          duration: session.duration,
          mode: session.mode,
          startTime: new Date(session.start_time),
          endTime: session.end_time ? new Date(session.end_time) : undefined,
          completed: session.completed,
          taskContext: session.task_context,
          productivityScore: session.productivity_score,
          aiSuggested: session.ai_suggested,
          feedbackRating: session.feedback_rating,
          createdAt: new Date(session.created_at),
          updatedAt: new Date(session.updated_at)
        })));
      }
    } catch (error) {
      console.error('Error fetching timer sessions:', error);
    }
  };

  const handleTaskAdded = () => {
    setShowAddForm(false);
    fetchTasks();
  };

  const handleTaskUpdate = () => {
    fetchTasks();
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
            loading={loading}
            onTaskUpdate={handleTaskUpdate}
          />
        </div>

        <div>
          <Card className="mb-6">
            <Card className="mb-6">
              <TaskAnalytics timerSessions={timerSessions} />
            </Card>
            <TaskTemplates />
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
