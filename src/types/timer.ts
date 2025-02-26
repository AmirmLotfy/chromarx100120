
export interface TimerSession {
  id: string;
  userId: string;
  duration: number;
  mode: 'focus' | 'break';
  startTime: Date;
  endTime?: Date;
  completed: boolean;
  taskContext?: string;
  productivityScore?: number;
  aiSuggested: boolean;
  feedbackRating?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimerState {
  isRunning: boolean;
  timeLeft: number;
  currentSession: TimerSession | null;
}

export interface TimerStats {
  totalFocusTime: number;
  totalSessions: number;
  averageProductivity: number;
  completionRate: number;
}
