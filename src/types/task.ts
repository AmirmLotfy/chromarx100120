
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskCategory = 'work' | 'personal' | 'study' | string;
export type TaskStatus = 'pending' | 'in-progress' | 'completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  category: TaskCategory;
  status: TaskStatus;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  estimatedDuration: number; // in minutes
  actualDuration: number; // in minutes
  color: string;
  progress: number; // 0-100
}

export interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  tasksByPriority: Record<TaskPriority, number>;
  tasksByCategory: Record<string, number>;
  tasksByStatus: Record<TaskStatus, number>;
  completionRate: number;
}
