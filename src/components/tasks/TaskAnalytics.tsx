import { useState, useEffect } from "react";
import { chromeStorage } from "@/services/chromeStorageService";
import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { TaskPriority, TaskStatus } from "@/types/task";
import { TimerSession } from "@/types/timer";
import { localStorageClient } from "@/lib/chrome-storage-client";

interface TaskAnalytics {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  averageCompletionTime: number;
  tasksByPriority: { priority: TaskPriority; count: number }[];
  tasksByStatus: { status: TaskStatus; count: number }[];
  tasksByCategory: { category: string; count: number }[];
}

const COLORS = ['#10B981', '#6366F1', '#F59E0B', '#EF4444'];

const TaskAnalytics = () => {
  const [analytics, setAnalytics] = useState<TaskAnalytics | null>(null);
  const [timerSessions, setTimerSessions] = useState<TimerSession[]>([]);

  useEffect(() => {
    fetchAnalytics();
    fetchTimerSessions();
  }, []);

  const fetchTimerSessions = async () => {
    try {
      const result = await localStorageClient
        .from('timer_sessions')
        .select()
        .order('created_at', { ascending: false })
        .execute();

      if (result.data) {
        const sessions = result.data.map((session: any) => {
          const sessionMode: 'focus' | 'break' = session.mode === 'break' ? 'break' : 'focus';
          
          return {
            id: session.id || '',
            userId: session.user_id || '',
            duration: typeof session.duration === 'number' ? session.duration : 0,
            mode: sessionMode,
            startTime: new Date(session.start_time || new Date()),
            endTime: session.end_time ? new Date(session.end_time) : undefined,
            completed: Boolean(session.completed),
            taskContext: typeof session.task_context === 'string' ? session.task_context : undefined,
            productivityScore: typeof session.productivity_score === 'number' ? session.productivity_score : undefined,
            aiSuggested: Boolean(session.ai_suggested),
            feedbackRating: typeof session.feedback_rating === 'number' ? session.feedback_rating : undefined,
            createdAt: new Date(session.created_at || new Date()),
            updatedAt: new Date(session.updated_at || new Date())
          } as TimerSession;
        });
        setTimerSessions(sessions);
      }
    } catch (error) {
      console.error('Error fetching timer sessions:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const tasks = await chromeStorage.get<any[]>('tasks') || [];

      const analytics: TaskAnalytics = {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'completed').length,
        pendingTasks: tasks.filter(t => t.status === 'pending').length,
        averageCompletionTime: calculateAverageCompletionTime(tasks),
        tasksByPriority: calculateTasksByPriority(tasks),
        tasksByStatus: calculateTasksByStatus(tasks),
        tasksByCategory: calculateTasksByCategory(tasks)
      };

      setAnalytics(analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const calculateAverageCompletionTime = (tasks: any[]) => {
    const completedTasks = tasks.filter(t => t.status === 'completed' && t.actual_duration);
    if (completedTasks.length === 0) return 0;
    return Math.round(completedTasks.reduce((acc, t) => acc + t.actual_duration, 0) / completedTasks.length);
  };

  const calculateTasksByPriority = (tasks: any[]) => {
    const priorities: { [key: string]: number } = { high: 0, medium: 0, low: 0 };
    tasks.forEach(t => priorities[t.priority]++);
    return Object.entries(priorities).map(([priority, count]) => ({ 
      priority: priority as TaskPriority, 
      count 
    }));
  };

  const calculateTasksByStatus = (tasks: any[]) => {
    const statuses: { [key: string]: number } = { pending: 0, 'in-progress': 0, completed: 0 };
    tasks.forEach(t => statuses[t.status]++);
    return Object.entries(statuses).map(([status, count]) => ({ 
      status: status as TaskStatus, 
      count 
    }));
  };

  const calculateTasksByCategory = (tasks: any[]) => {
    const categories: { [key: string]: number } = {};
    tasks.forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + 1;
    });
    return Object.entries(categories).map(([category, count]) => ({ category, count }));
  };

  if (!analytics) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-1">Total Tasks</h3>
          <p className="text-2xl font-bold">{analytics.totalTasks}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-1">Completed</h3>
          <p className="text-2xl font-bold text-green-500">{analytics.completedTasks}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-1">Pending</h3>
          <p className="text-2xl font-bold text-yellow-500">{analytics.pendingTasks}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-1">Avg. Completion Time</h3>
          <p className="text-2xl font-bold">{analytics.averageCompletionTime}min</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-4">Tasks by Priority</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.tasksByPriority}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="priority" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#6366F1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium mb-4">Tasks by Category</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.tasksByCategory}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {analytics.tasksByCategory.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TaskAnalytics;
