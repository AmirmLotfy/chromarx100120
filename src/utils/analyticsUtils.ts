
import { localStorageClient } from '@/lib/chrome-storage-client';
import { format, subDays, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { AnalyticsData, DailyAnalytics, DomainStat, ProductivityTrend, TimeDistributionData } from '@/types/analytics';

export interface DailyAnalyticsData {
  date: string;
  count: number;
}

// Export the type from lib/json-types.ts to help with usage across the app
export type { Json } from '@/lib/json-types';

export async function fetchAnalyticsData(): Promise<AnalyticsData> {
  try {
    // Get all bookmarks
    const result = await localStorageClient
      .from('bookmarks')
      .select()
      .execute();

    if (result.error) {
      throw result.error;
    }

    // Use an empty array if there are no bookmarks
    const bookmarksArray = result.data || [];

    // Calculate total bookmarks
    const totalBookmarks = bookmarksArray.length;

    // Calculate bookmarks added today
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const bookmarksToday = bookmarksArray.filter(bookmark => {
      const bookmarkObj = bookmark as Record<string, any>;
      const createdAt = typeof bookmarkObj.created_at === 'string' ? bookmarkObj.created_at : '';
      return createdAt.startsWith(todayStr);
    }).length;

    // Calculate bookmarks added this week
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);
    const bookmarksThisWeek = bookmarksArray.filter(bookmark => {
      const bookmarkObj = bookmark as Record<string, any>;
      const createdAt = typeof bookmarkObj.created_at === 'string' ? new Date(bookmarkObj.created_at) : null;
      return createdAt && createdAt >= weekStart && createdAt <= weekEnd;
    }).length;

    // Calculate top domains
    const domainCounts = bookmarksArray.reduce((acc, bookmark) => {
      const bookmarkObj = bookmark as Record<string, any>;
      const domain = typeof bookmarkObj.domain === 'string' ? bookmarkObj.domain : 'unknown';
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
        const bookmarkObj = bookmark as Record<string, any>;
        const createdAt = typeof bookmarkObj.created_at === 'string' ? bookmarkObj.created_at : '';
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

// Export this function for components that need analytics data
export async function getAnalyticsData(): Promise<AnalyticsData> {
  // Mock analytics data that follows the AnalyticsData interface
  const productivityScore = 78;
  const timeDistribution: TimeDistributionData[] = [
    { category: 'Work', time: 25200000 },
    { category: 'Learning', time: 10800000 },
    { category: 'Entertainment', time: 7200000 },
    { category: 'Social', time: 5400000 }
  ];
  
  const domainStats: DomainStat[] = [
    { domain: 'github.com', visits: 42, timeSpent: 7200000 },
    { domain: 'docs.google.com', visits: 38, timeSpent: 5400000 },
    { domain: 'mail.google.com', visits: 65, timeSpent: 3600000 },
    { domain: 'youtube.com', visits: 27, timeSpent: 9000000 },
    { domain: 'stackoverflow.com', visits: 19, timeSpent: 2700000 }
  ];
  
  const productivityTrends: ProductivityTrend[] = [
    { date: 'Mon', score: 82 },
    { date: 'Tue', score: 75 },
    { date: 'Wed', score: 68 },
    { date: 'Thu', score: 71 },
    { date: 'Fri', score: 85 },
    { date: 'Sat', score: 63 },
    { date: 'Sun', score: 72 }
  ];

  return {
    productivityScore,
    timeDistribution,
    domainStats,
    productivityTrends
  };
}

export async function updateAnalyticsPreferences(preferences: any): Promise<void> {
  try {
    // Mock user ID since we're using local storage
    const userId = 'local-user';
    
    await localStorageClient
      .from('user_preferences')
      .upsert({
        analytics_preferences: preferences,
        updated_at: new Date().toISOString(),
        user_id: userId
      })
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
