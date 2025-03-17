
export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "pending" | "in-progress" | "completed" | "canceled";

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: TaskPriority;
  category: string;
  status: TaskStatus;
  estimatedDuration: number;
  actualDuration: number | null;
  progress: number;
  color: string;
  createdAt: string;
  updatedAt: string;
  userId?: string; // Making this optional to match the existing code
}
