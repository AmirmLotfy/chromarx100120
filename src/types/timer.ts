
export interface TimerSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime: Date | null;
  duration: number;
  taskId?: string | null; // Adding taskId to fix the type error
  notes?: string | null;
  productivityScore?: number | null;
  category?: string | null;
  tags?: string[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export type TimerMode = 'focus' | 'break';

export interface TimerSettings {
  focusDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  alarmSound: string;
  alarmVolume: number;
}
