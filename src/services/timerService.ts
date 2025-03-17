import { localStorageClient } from '@/lib/chrome-storage-client';
import { TimerSession, TimerStats } from "@/types/timer";
import { toast } from "sonner";

interface DbTimerSession {
  id: string;
  user_id: string;
  duration: number;
  mode: 'focus' | 'break';
  start_time: string;
  end_time?: string;
  completed: boolean;
  task_context?: string;
  productivity_score?: number;
  ai_suggested: boolean;
  feedback_rating?: number;
  created_at: string;
  updated_at: string;
}

class TimerService {
  private static instance: TimerService;
  private audioContext: AudioContext | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.audioContext = new AudioContext();
      } catch (error) {
        console.error("Could not create audio context:", error);
      }
    }
  }

  static getInstance(): TimerService {
    if (!this.instance) {
      this.instance = new TimerService();
    }
    return this.instance;
  }

  async startSession(session: Omit<TimerSession, 'id' | 'userId' | 'completed' | 'createdAt' | 'updatedAt'>): Promise<TimerSession> {
    try {
      const id = 'timer-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
      const userId = 'local-user';
      
      const dbSession: DbTimerSession = {
        id,
        user_id: userId,
        duration: session.duration,
        mode: session.mode,
        start_time: session.startTime.toISOString(),
        task_context: session.taskContext,
        ai_suggested: session.aiSuggested,
        completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const result = await localStorageClient
        .from('timer_sessions')
        .insert(dbSession)
        .execute();

      if (result.error) throw result.error;
      
      if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        const data = result.data[0];
        return this.mapSessionFromDb(data);
      }
      
      throw new Error('Failed to insert timer session');
    } catch (error) {
      console.error('Error starting timer session:', error);
      toast.error('Failed to start timer session');
      throw error;
    }
  }

  async completeSession(sessionId: string, productivityScore?: number): Promise<void> {
    try {
      const result = await localStorageClient
        .from('timer_sessions')
        .update({
          completed: true,
          end_time: new Date().toISOString(),
          productivity_score: productivityScore,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .execute();

      if (result.error) throw result.error;
      
      await this.playCompletionSound();
      this.showNotification();
    } catch (error) {
      console.error('Error completing timer session:', error);
      toast.error('Failed to complete timer session');
      throw error;
    }
  }

  async getStats(): Promise<TimerStats> {
    try {
      const result = await localStorageClient
        .from('timer_sessions')
        .select()
        .execute();

      if (result.error) throw result.error;
      
      // Ensure result.data is an array
      const sessions = Array.isArray(result.data) ? result.data : [];

      if (sessions.length === 0) return {
        totalFocusTime: 0,
        totalSessions: 0,
        averageProductivity: 0,
        completionRate: 0
      };

      const focusSessions = sessions.filter(s => {
        const sessionObj = s as Record<string, any>;
        return typeof sessionObj.mode === 'string' && sessionObj.mode === 'focus';
      });
      
      const completedSessions = sessions.filter(s => {
        const sessionObj = s as Record<string, any>;
        return typeof sessionObj.completed === 'boolean' && sessionObj.completed === true;
      });
      
      const totalSessions = sessions.length;

      // Fix for error TS2365: Ensure duration is a number before adding
      const totalFocusTime: number = focusSessions.reduce((acc: number, s) => {
        const sessionObj = s as Record<string, any>;
        // Fix for error TS2365: Ensure duration is a number before adding
        const duration = typeof sessionObj.duration === 'number' ? sessionObj.duration : 0;
        return acc + duration;
      }, 0);

      let sumProductivity = 0;
      let countWithScores = 0;
      
      completedSessions.forEach(s => {
        const sessionObj = s as Record<string, any>;
        const score = typeof sessionObj.productivity_score === 'number' ? sessionObj.productivity_score : 0;
        if (score > 0) {
          sumProductivity += score;
          countWithScores++;
        }
      });
      
      // Fix for error TS2322: Explicitly defining the type as number
      const averageProductivity: number = countWithScores > 0 ? sumProductivity / countWithScores : 0;

      return {
        totalFocusTime,
        totalSessions,
        averageProductivity,
        completionRate: totalSessions > 0 
          ? (completedSessions.length / totalSessions) * 100 
          : 0
      };
    } catch (error) {
      console.error('Error fetching timer stats:', error);
      toast.error('Failed to fetch timer statistics');
      throw error;
    }
  }

  async provideFeedback(sessionId: string, rating: number): Promise<void> {
    try {
      const result = await localStorageClient
        .from('timer_sessions')
        .update({ 
          feedback_rating: rating,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .execute();

      if (result.error) throw result.error;
      toast.success('Thank you for your feedback!');
    } catch (error) {
      console.error('Error saving feedback:', error);
      toast.error('Failed to save feedback');
      throw error;
    }
  }

  async playCompletionSound(): Promise<void> {
    if (!this.audioContext) {
      try {
        this.audioContext = new AudioContext();
      } catch (error) {
        console.error("Could not create audio context:", error);
        return;
      }
    }

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);

      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('Error playing completion sound:', error);
    }
  }

  showNotification(): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Timer Complete!', {
        body: 'Your timer session has finished.',
        icon: '/icon128.png'
      });
    }
  }

  private mapSessionFromDb(data: any): TimerSession {
    if (!data) {
      return {} as TimerSession;
    }
    
    const mode: 'focus' | 'break' = data.mode === 'break' ? 'break' : 'focus';
    
    const duration = typeof data.duration === 'number' ? data.duration : 0;
    
    let productivityScore: number | undefined = undefined;
    if (typeof data.productivity_score === 'number') {
      productivityScore = data.productivity_score;
    }
    
    return {
      id: typeof data.id === 'string' ? data.id : '',
      userId: typeof data.user_id === 'string' ? data.user_id : '',
      duration,
      mode,
      startTime: new Date(data.start_time || new Date()),
      endTime: data.end_time ? new Date(data.end_time) : undefined,
      completed: Boolean(data.completed),
      taskContext: typeof data.task_context === 'string' ? data.task_context : undefined,
      productivityScore,
      aiSuggested: Boolean(data.ai_suggested),
      feedbackRating: typeof data.feedback_rating === 'number' ? data.feedback_rating : undefined,
      createdAt: new Date(data.created_at || new Date()),
      updatedAt: new Date(data.updated_at || new Date())
    };
  }
}

export const timerService = TimerService.getInstance();
