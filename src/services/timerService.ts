import { localStorageClient } from "@/lib/chrome-storage-client";
import { TimerSession } from "@/types/timer";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

// Define a proper interface for database timer sessions
interface DbTimerSession {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  duration: number;
  task_id: string | null;
  notes: string | null;
  productivity_score: number | null;
  created_at: string;
  updated_at: string;
  category: string | null;
  tags: string[] | null;
}

// Define interface for timer session creation
interface TimerSessionCreate {
  duration: number;
  mode: 'focus' | 'break';
  startTime: Date;
  taskContext?: string;
  aiSuggested?: boolean; 
}

// Helper function to convert database timer session to our app model
const mapDbTimerSession = (session: DbTimerSession): TimerSession => {
  return {
    id: session.id,
    userId: session.user_id,
    startTime: new Date(session.start_time),
    endTime: session.end_time ? new Date(session.end_time) : null,
    duration: session.duration,
    taskId: session.task_id,
    notes: session.notes,
    productivityScore: session.productivity_score,
    category: session.category,
    tags: session.tags || [],
    createdAt: new Date(session.created_at),
    updatedAt: new Date(session.updated_at),
  };
};

// Play notification sound
const playSound = () => {
  try {
    const audio = new Audio('/notification.mp3');
    audio.play();
  } catch (error) {
    console.error('Error playing sound:', error);
  }
};

export const timerService = {
  async createTimerSession(userId: string): Promise<TimerSession | null> {
    try {
      const now = new Date();
      const sessionId = uuidv4();
      
      const newSession = {
        id: sessionId,
        user_id: userId,
        start_time: now.toISOString(),
        end_time: null,
        duration: 0,
        task_id: null,
        notes: null,
        productivity_score: null,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        category: null,
        tags: []
      };
      
      const { data, error } = await localStorageClient
        .from('timer_sessions')
        .insert(newSession)
        .execute();
      
      if (error) {
        throw error;
      }
      
      const sessions = data as DbTimerSession[] || [];
      const session = sessions.length > 0 ? sessions[0] : null;
      
      if (!session) {
        throw new Error('Failed to create timer session');
      }
      
      return mapDbTimerSession(session);
    } catch (error) {
      console.error('Error creating timer session:', error);
      toast.error('Failed to start timer');
      return null;
    }
  },
  
  async endTimerSession(sessionId: string, duration: number, notes?: string, taskId?: string, productivityScore?: number): Promise<TimerSession | null> {
    try {
      const now = new Date();
      const updates = {
        end_time: now.toISOString(),
        duration,
        notes: notes || null,
        task_id: taskId || null,
        productivity_score: productivityScore || null,
        updated_at: now.toISOString()
      };
      
      const { data, error } = await localStorageClient
        .from('timer_sessions')
        .update(updates)
        .eq('id', sessionId)
        .execute();
      
      if (error) {
        throw error;
      }
      
      const sessions = data as DbTimerSession[] || [];
      const session = sessions.length > 0 ? sessions[0] : null;
      
      if (!session) {
        throw new Error('Failed to update timer session');
      }
      
      return mapDbTimerSession(session);
    } catch (error) {
      console.error('Error ending timer session:', error);
      toast.error('Failed to end timer');
      return null;
    }
  },
  
  async getActiveTimerSession(userId: string): Promise<TimerSession | null> {
    try {
      const { data, error } = await localStorageClient
        .from('timer_sessions')
        .select()
        .eq('user_id', userId)
        .eq('end_time', null)
        .execute();
      
      if (error) {
        throw error;
      }
      
      const sessions = data as DbTimerSession[] || [];
      const session = sessions.length > 0 ? sessions[0] : null;
      
      return session ? mapDbTimerSession(session) : null;
    } catch (error) {
      console.error('Error getting active timer session:', error);
      return null;
    }
  },
  
  async getUserTimerSessions(userId: string, limit: number = 10): Promise<TimerSession[]> {
    try {
      const { data, error } = await localStorageClient
        .from('timer_sessions')
        .select()
        .eq('user_id', userId)
        .order('start_time', { ascending: false })
        .execute();
      
      if (error) {
        throw error;
      }
      
      const sessions = data as DbTimerSession[] || [];
      return sessions.slice(0, limit).map(mapDbTimerSession);
    } catch (error) {
      console.error('Error getting user timer sessions:', error);
      return [];
    }
  },
  
  async getProductivityStats(userId: string): Promise<{ 
    totalSessions: number; 
    totalMinutes: number; 
    averageProductivity: number; 
    mostProductiveDay: string | null;
  }> {
    try {
      const { data, error } = await localStorageClient
        .from('timer_sessions')
        .select()
        .eq('user_id', userId)
        .execute();
      
      if (error) {
        throw error;
      }
      
      const sessions = data as DbTimerSession[] || [];
      
      // Calculate stats
      const totalSessions = sessions.length;
      const totalMinutes = sessions.reduce((sum, session) => sum + (session.duration || 0), 0) / 60;
      
      // Calculate average productivity from completed sessions with scores
      const sessionsWithScores = sessions.filter(s => s.end_time && s.productivity_score !== null);
      const averageProductivity: number = sessionsWithScores.length > 0 
        ? sessionsWithScores.reduce((sum, s) => sum + (s.productivity_score || 0), 0) / sessionsWithScores.length 
        : 0;
      
      // Find most productive day
      const dayStats: Record<string, { count: number; totalScore: number }> = {};
      
      for (const session of sessions) {
        if (session.end_time && session.productivity_score !== null) {
          const day = new Date(session.start_time).toISOString().split('T')[0];
          if (!dayStats[day]) {
            dayStats[day] = { count: 0, totalScore: 0 };
          }
          dayStats[day].count += 1;
          dayStats[day].totalScore += session.productivity_score || 0;
        }
      }
      
      let mostProductiveDay: string | null = null;
      let highestAverage = 0;
      
      for (const [day, stats] of Object.entries(dayStats)) {
        const average = stats.totalScore / stats.count;
        if (average > highestAverage && stats.count >= 2) {
          highestAverage = average;
          mostProductiveDay = day;
        }
      }
      
      return {
        totalSessions,
        totalMinutes,
        averageProductivity,
        mostProductiveDay
      };
    } catch (error) {
      console.error('Error getting productivity stats:', error);
      return {
        totalSessions: 0,
        totalMinutes: 0,
        averageProductivity: 0,
        mostProductiveDay: null
      };
    }
  },

  // New methods to support TimerPage.tsx
  async startSession(params: TimerSessionCreate): Promise<TimerSession> {
    try {
      const userId = 'local-user'; // Use local user ID 
      const now = new Date();
      const sessionId = uuidv4();
      
      const newSession = {
        id: sessionId,
        user_id: userId,
        start_time: params.startTime.toISOString(),
        end_time: null,
        duration: params.duration,
        task_id: null,
        notes: params.taskContext || null,
        productivity_score: null,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        category: params.mode,
        tags: []
      };
      
      const { data, error } = await localStorageClient
        .from('timer_sessions')
        .insert(newSession)
        .execute();
      
      if (error) {
        throw error;
      }
      
      const sessions = data as DbTimerSession[] || [];
      const session = sessions.length > 0 ? sessions[0] : null;
      
      if (!session) {
        throw new Error('Failed to create timer session');
      }
      
      return mapDbTimerSession(session);
    } catch (error) {
      console.error('Error starting timer session:', error);
      toast.error('Failed to start timer');
      throw error;
    }
  },
  
  async completeSession(sessionId: string): Promise<void> {
    try {
      // Get the current session to calculate accurate duration
      const { data, error } = await localStorageClient
        .from('timer_sessions')
        .select()
        .eq('id', sessionId)
        .execute();
        
      if (error) throw error;
      
      const sessions = data as DbTimerSession[] || [];
      const session = sessions.length > 0 ? sessions[0] : null;
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      // Calculate actual duration
      const startTime = new Date(session.start_time);
      const endTime = new Date();
      const durationInSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      
      // Update the session with end time and duration
      await this.endTimerSession(sessionId, durationInSeconds);
    } catch (error) {
      console.error('Error completing session:', error);
      toast.error('Failed to complete timer session');
      throw error;
    }
  },
  
  async provideFeedback(sessionId: string, productivityScore: number): Promise<void> {
    try {
      const { data, error } = await localStorageClient
        .from('timer_sessions')
        .update({ productivity_score: productivityScore, updated_at: new Date().toISOString() })
        .eq('id', sessionId)
        .execute();
        
      if (error) throw error;
      
      toast.success('Feedback recorded, thank you!');
    } catch (error) {
      console.error('Error providing feedback:', error);
      toast.error('Failed to record feedback');
      throw error;
    }
  },
  
  playCompletionSound(): void {
    playSound();
  },
  
  showNotification(): void {
    // Check if browser supports notifications
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Timer Complete', {
          body: 'Your timer session has ended.',
          icon: '/icon128.png'
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('Timer Complete', {
              body: 'Your timer session has ended.',
              icon: '/icon128.png'
            });
          }
        });
      }
    }
  }
};
