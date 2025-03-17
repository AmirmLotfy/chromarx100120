
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, Circle, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export interface TaskListProps {
  tasks: any[];
  onTaskUpdate: () => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onTaskUpdate }) => {
  const [loading, setLoading] = React.useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'pending':
        return <Circle className="h-5 w-5 text-gray-400" />;
      case 'overdue':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const handleMarkComplete = async (taskId: string) => {
    setLoading(true);
    try {
      // Update task status to completed
      await updateTaskStatus(taskId, 'completed');
      onTaskUpdate();
    } catch (error) {
      console.error('Error completing task:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      // Call to localStorageClient to update task status
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            No tasks found. Create a new task to get started.
          </CardContent>
        </Card>
      ) : (
        tasks.map((task) => (
          <Card key={task.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <button
                    onClick={() => handleMarkComplete(task.id)}
                    disabled={task.status === 'completed'}
                    className="mt-1 focus:outline-none"
                  >
                    {getStatusIcon(task.status)}
                  </button>
                  <div>
                    <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                      {task.title}
                    </h3>
                    <p className="text-sm text-gray-500">{task.description}</p>
                    {task.due_date && (
                      <p className="text-xs text-gray-500 mt-1">
                        Due: {format(new Date(task.due_date), 'PPP')}
                      </p>
                    )}
                  </div>
                </div>
                <div className={`text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                  {task.priority.toUpperCase()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default TaskList;
