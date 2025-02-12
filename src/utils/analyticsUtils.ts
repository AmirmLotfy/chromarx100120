
import { AnalyticsData, VisitData, ProductivityTrend, TimeDistributionData, DomainStat } from "@/types/analytics";
import { extractDomain } from "@/utils/domainUtils";
import { chromeDb } from "@/lib/chrome-storage";

export const getAnalyticsData = async (): Promise<AnalyticsData> => {
  try {
    console.log("Fetching analytics data...");
    
    // Get browsing history and current tabs
    const [history, tabs] = await Promise.all([
      chrome.history.search({ 
        text: "", 
        maxResults: 10000, 
        startTime: Date.now() - 30 * 24 * 60 * 60 * 1000 // Last 30 days
      }),
      chrome.tabs.query({})
    ]);

    // Get browsing time data from chrome.history
    const visitTimeData = await Promise.all(
      history.map(async item => {
        if (!item.url) return null;
        const visits = await chrome.history.getVisits({ url: item.url });
        return {
          url: item.url,
          domain: extractDomain(item.url),
          visitCount: visits.length,
          timeSpent: calculateTimeSpent(visits),
          lastVisitTime: item.lastVisitTime || 0
        };
      })
    );

    const visitData: VisitData[] = visitTimeData.filter((item): item is VisitData => item !== null);

    // Store analytics data for persistence
    await chromeDb.set('analytics_data', {
      timestamp: Date.now(),
      visitData
    });

    return {
      productivityScore: calculateProductivityScore(visitData, tabs),
      timeDistribution: calculateTimeDistribution(visitData),
      domainStats: calculateDomainStats(visitData),
      productivityTrends: await calculateProductivityTrends(visitData)
    };
  } catch (error) {
    console.error("Error getting analytics data:", error);
    throw error;
  }
};

const calculateTimeSpent = (visits: chrome.history.VisitItem[]): number => {
  let totalTime = 0;
  
  for (let i = 0; i < visits.length - 1; i++) {
    const timeDiff = visits[i + 1].visitTime - visits[i].visitTime;
    if (timeDiff < 30 * 60 * 1000) { // Less than 30 minutes
      totalTime += timeDiff;
    }
  }
  
  return totalTime;
};

const calculateDomainStats = (visitData: VisitData[]): DomainStat[] => {
  const stats = new Map<string, { visits: number; timeSpent: number }>();
  
  visitData.forEach(visit => {
    const current = stats.get(visit.domain) || { visits: 0, timeSpent: 0 };
    stats.set(visit.domain, {
      visits: current.visits + visit.visitCount,
      timeSpent: current.timeSpent + visit.timeSpent
    });
  });

  return Array.from(stats.entries())
    .map(([domain, data]) => ({
      domain,
      visits: data.visits,
      timeSpent: data.timeSpent
    }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 10);
};

const calculateTimeDistribution = (visitData: VisitData[]): TimeDistributionData[] => {
  const categories = new Map<string, number>();
  
  visitData.forEach(visit => {
    const category = determineCategory(visit.domain);
    const current = categories.get(category) || 0;
    categories.set(category, current + visit.timeSpent);
  });

  return Array.from(categories.entries())
    .map(([category, time]) => ({ category, time }));
};

const calculateProductivityScore = (visitData: VisitData[], tabs: chrome.tabs.Tab[]): number => {
  const factors = {
    tabEfficiency: calculateTabEfficiency(tabs),
    browsingFocus: calculateBrowsingFocus(visitData),
    timeManagement: calculateTimeManagement(visitData)
  };

  return Math.round(
    (factors.tabEfficiency + factors.browsingFocus + factors.timeManagement) / 3 * 100
  );
};

const calculateProductivityTrends = async (visitData: VisitData[]): Promise<ProductivityTrend[]> => {
  const trends: ProductivityTrend[] = [];
  const days = 7;

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayStart = new Date(date.setHours(0, 0, 0, 0)).getTime();
    const dayEnd = new Date(date.setHours(23, 59, 59, 999)).getTime();

    const dayData = visitData.filter(
      visit => visit.lastVisitTime >= dayStart && visit.lastVisitTime <= dayEnd
    );

    trends.push({
      date: date.toISOString().split('T')[0],
      score: calculateDailyProductivityScore(dayData)
    });
  }

  return trends.reverse();
};

const determineCategory = (domain: string): string => {
  const productivityDomains = [
    'github.com', 'stackoverflow.com', 'docs.google.com', 'gitlab.com',
    'bitbucket.org', 'atlassian.com', 'notion.so', 'trello.com',
    'asana.com', 'monday.com', 'linear.app', 'figma.com'
  ];

  const learningDomains = [
    'coursera.org', 'udemy.com', 'edx.org', 'khan-academy.org',
    'pluralsight.com', 'egghead.io', 'frontendmasters.com'
  ];

  const socialDomains = [
    'facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com',
    'reddit.com', 'tiktok.com', 'snapchat.com'
  ];

  const entertainmentDomains = [
    'youtube.com', 'netflix.com', 'spotify.com', 'twitch.tv',
    'disney.com', 'hulu.com', 'hbomax.com'
  ];

  const newsDomains = [
    'news.google.com', 'reuters.com', 'bloomberg.com', 'bbc.com',
    'cnn.com', 'nytimes.com', 'wsj.com'
  ];

  if (productivityDomains.some(d => domain.includes(d))) return 'Productivity';
  if (learningDomains.some(d => domain.includes(d))) return 'Learning';
  if (socialDomains.some(d => domain.includes(d))) return 'Social';
  if (entertainmentDomains.some(d => domain.includes(d))) return 'Entertainment';
  if (newsDomains.some(d => domain.includes(d))) return 'News';

  return 'Other';
};

const calculateTabEfficiency = (tabs: chrome.tabs.Tab[]): number => {
  const maxEfficient = 15;
  return Math.min(1, maxEfficient / Math.max(tabs.length, 1));
};

const calculateBrowsingFocus = (visitData: VisitData[]): number => {
  const uniqueDomains = new Set(visitData.map(v => v.domain)).size;
  const maxFocused = 10;
  return Math.min(1, maxFocused / Math.max(uniqueDomains, 1));
};

const calculateTimeManagement = (visitData: VisitData[]): number => {
  const totalTime = visitData.reduce((sum, visit) => sum + visit.timeSpent, 0);
  const maxProductiveTime = 8 * 60 * 60 * 1000; // 8 hours
  return Math.min(1, totalTime / maxProductiveTime);
};

const calculateDailyProductivityScore = (dayData: VisitData[]): number => {
  if (dayData.length === 0) return 0;
  
  const productiveRatio = dayData.filter(visit => 
    ['Productivity', 'Learning'].includes(determineCategory(visit.domain))
  ).length / dayData.length;

  return Math.round(productiveRatio * 100);
};
