import { AnalyticsData, VisitData, ProductivityTrend, TimeDistributionData, DomainStat } from "@/types/analytics";
import { extractDomain } from "@/utils/domainUtils";

export const getAnalyticsData = async (): Promise<AnalyticsData> => {
  try {
    console.log("Fetching analytics data...");
    const [history, tabs] = await Promise.all([
      chrome.history.search({ text: "", maxResults: 10000, startTime: Date.now() - 30 * 24 * 60 * 60 * 1000 }),
      chrome.tabs.query({})
    ]);

    const visitData: VisitData[] = history.map(item => ({
      url: item.url || "",
      domain: extractDomain(item.url || ""),
      visitCount: item.visitCount || 0,
      timeSpent: 0,
      lastVisitTime: item.lastVisitTime || 0
    }));

    const domainStats = calculateDomainStats(visitData);
    const timeDistribution = calculateTimeDistribution(visitData);
    const productivityScore = calculateProductivityScore(visitData, tabs);
    const productivityTrends = await calculateProductivityTrends(visitData);

    return {
      productivityScore,
      timeDistribution,
      domainStats,
      productivityTrends
    };
  } catch (error) {
    console.error("Error getting analytics data:", error);
    throw error;
  }
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
  const categories: Record<string, string[]> = {
    'Productivity': ['docs.google.com', 'github.com', 'stackoverflow.com'],
    'Social': ['facebook.com', 'twitter.com', 'instagram.com'],
    'Entertainment': ['youtube.com', 'netflix.com', 'spotify.com'],
    'News': ['news.google.com', 'reuters.com', 'bbc.com']
  };

  for (const [category, domains] of Object.entries(categories)) {
    if (domains.some(d => domain.includes(d))) {
      return category;
    }
  }

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
    determineCategory(visit.domain) === 'Productivity'
  ).length / dayData.length;

  return Math.round(productiveRatio * 100);
};