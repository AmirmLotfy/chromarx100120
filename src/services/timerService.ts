
import { localStorageClient as supabase } from '@/lib/local-storage-client';
import { TimerSession, TimerStats } from "@/types/timer";
import { toast } from "sonner";

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
      const userData = await supabase.auth.getUser();
      const user = userData.data.user;
      if (!user) throw new Error('User not authenticated');

      const result = await supabase
        .from('timer_sessions')
        .insert([{
          user_id: user.id,
          duration: session.duration,
          mode: session.mode,
          start_time: session.startTime.toISOString(),
          task_context: session.taskContext,
          ai_suggested: session.aiSuggested,
        }])
        .select();

      // Manually check for error and data
      if (result.error) throw result.error;
      const data = result.data?.[0];
      if (!data) throw new Error('Failed to insert timer session');

      return this.mapSessionFromDb(data);
    } catch (error) {
      console.error('Error starting timer session:', error);
      toast.error('Failed to start timer session');
      throw error;
    }
  }

  async completeSession(sessionId: string, productivityScore?: number): Promise<void> {
    try {
      const result = await supabase
        .from('timer_sessions')
        .update({
          completed: true,
          end_time: new Date().toISOString(),
          productivity_score: productivityScore
        })
        .eq('id', sessionId);

      // Manually check for error
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
      const result = await supabase
        .from('timer_sessions')
        .select('*');

      // Manually check for error and data
      if (result.error) throw result.error;
      const sessions = result.data || [];

      if (sessions.length === 0) return {
        totalFocusTime: 0,
        totalSessions: 0,
        averageProductivity: 0,
        completionRate: 0
      };

      const focusSessions = sessions.filter(s => s.mode === 'focus');
      const completedSessions = sessions.filter(s => s.completed);
      const totalSessions = sessions.length;

      return {
        totalFocusTime: focusSessions.reduce((acc, s) => acc + (s.duration || 0), 0),
        totalSessions,
        averageProductivity: totalSessions > 0 
          ? completedSessions.reduce((acc, s) => acc + (s.productivity_score || 0), 0) / totalSessions 
          : 0,
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
      const { error } = await supabase
        .from('timer_sessions')
        .update({ feedback_rating: rating })
        .eq('id', sessionId);

      if (error) throw error;
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
    return {
      id: data.id,
      userId: data.user_id,
      duration: data.duration,
      mode: data.mode,
      startTime: new Date(data.start_time),
      endTime: data.end_time ? new Date(data.end_time) : undefined,
      completed: data.completed || false,
      taskContext: data.task_context,
      productivityScore: data.productivity_score,
      aiSuggested: data.ai_suggested || false,
      feedbackRating: data.feedback_rating,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }
}

export const timerService = TimerService.getInstance();
