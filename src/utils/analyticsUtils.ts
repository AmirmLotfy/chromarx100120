
import { localStorageClient } from '@/lib/chrome-storage-client';
import { format, subDays, startOfWeek, endOfWeek, addDays } from 'date-fns';

export interface DailyAnalytics {
  date: string;
  count: number;
}

export interface AnalyticsData {
  totalBookmarks: number;
  bookmarksThisWeek: number;
  bookmarksToday: number;
  topDomains: { domain: string; count: number }[];
  trendData: DailyAnalytics[];
}

export async function fetchAnalyticsData(): Promise<AnalyticsData> {
  try {
    // Get all bookmarks
    const { data: bookmarks, error } = await localStorageClient
      .from('bookmarks')
      .select()
      .execute();

    if (error) {
      throw error;
    }

    // Use an empty array if there are no bookmarks
    const bookmarksArray = bookmarks || [];

    // Calculate total bookmarks
    const totalBookmarks = bookmarksArray.length;

    // Calculate bookmarks added today
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const bookmarksToday = bookmarksArray.filter(bookmark => {
      const createdAt = typeof bookmark.created_at === 'string' ? bookmark.created_at : '';
      return createdAt.startsWith(todayStr);
    }).length;

    // Calculate bookmarks added this week
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);
    const bookmarksThisWeek = bookmarksArray.filter(bookmark => {
      const createdAt = typeof bookmark.created_at === 'string' ? new Date(bookmark.created_at) : null;
      return createdAt && createdAt >= weekStart && createdAt <= weekEnd;
    }).length;

    // Calculate top domains
    const domainCounts = bookmarksArray.reduce((acc, bookmark) => {
      const domain = typeof bookmark.domain === 'string' ? bookmark.domain : 'unknown';
      acc[domain] = (acc[domain] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topDomains = Object.entries(domainCounts)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Generate trend data for the last 7 days
    const trendData: DailyAnalytics[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const count = bookmarksArray.filter(bookmark => {
        const createdAt = typeof bookmark.created_at === 'string' ? bookmark.created_at : '';
        return createdAt.startsWith(dateStr);
      }).length;
      trendData.push({ date: format(date, 'MMM dd'), count });
    }

    return {
      totalBookmarks,
      bookmarksThisWeek,
      bookmarksToday,
      topDomains,
      trendData
    };
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return {
      totalBookmarks: 0,
      bookmarksThisWeek: 0,
      bookmarksToday: 0,
      topDomains: [],
      trendData: []
    };
  }
}

export async function updateAnalyticsPreferences(preferences: any): Promise<void> {
  try {
    const userId = (await localStorageClient.auth.getUser()).data.user?.id;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    await localStorageClient
      .from('user_preferences')
      .update({
        analytics_preferences: preferences,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .execute();
  } catch (error) {
    console.error('Error updating analytics preferences:', error);
    throw error;
  }
}

export async function trackEvent(eventName: string, eventData: Record<string, any> = {}): Promise<void> {
  try {
    // Create new analytics event
    await localStorageClient
      .from('analytics_events')
      .insert({
        event_name: eventName,
        event_data: eventData,
        created_at: new Date().toISOString(),
        user_id: 'anonymous' // Since we're using local storage, we'll use a default user ID
      })
      .execute();
  } catch (error) {
    console.error('Error tracking analytics event:', error);
  }
}

export function generateWeeklyDateLabels(): string[] {
  const today = new Date();
  const startDay = startOfWeek(today);
  const labels: string[] = [];
  
  for (let i = 0; i < 7; i++) {
    const day = addDays(startDay, i);
    labels.push(format(day, 'EEE'));
  }
  
  return labels;
}
