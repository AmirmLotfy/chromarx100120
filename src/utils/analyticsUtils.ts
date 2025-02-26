import { AnalyticsData, VisitData, ProductivityTrend, TimeDistributionData, DomainStat } from "@/types/analytics";
import { extractDomain } from "@/utils/domainUtils";
import { chromeDb } from "@/lib/chrome-storage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000; // 1 second

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = INITIAL_DELAY
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries === 0) {
      throw error;
    }
    console.log(`Retrying operation. Attempts remaining: ${retries}`);
    await sleep(delay);
    return retryWithBackoff(operation, retries - 1, delay * 2);
  }
}

export const getAnalyticsData = async (): Promise<AnalyticsData> => {
  try {
    console.log("Fetching analytics data...");
    
    // Get browsing history and current tabs with retry mechanism
    const [history, tabs] = await Promise.all([
      retryWithBackoff(() => 
        chrome.history.search({ 
          text: "", 
          maxResults: 10000, 
          startTime: Date.now() - 30 * 24 * 60 * 60 * 1000 
        })
      ),
      retryWithBackoff(() => 
        chrome.tabs.query({})
      )
    ]);

    // Get browsing time data
    const visitTimeData = await Promise.all(
      history.map(async item => {
        if (!item.url) return null;
        try {
          const visits = await retryWithBackoff(() => 
            chrome.history.getVisits({ url: item.url })
          );
          return {
            url: item.url,
            domain: extractDomain(item.url),
            visitCount: visits.length,
            timeSpent: calculateTimeSpent(visits),
            lastVisitTime: item.lastVisitTime || 0
          };
        } catch (error) {
          console.error(`Error processing visits for ${item.url}:`, error);
          toast.error(`Failed to process some visit data`);
          return null;
        }
      })
    );

    const visitData: VisitData[] = visitTimeData.filter((item): item is VisitData => item !== null);

    // Get custom domain categories from Supabase
    const { data: customCategories } = await supabase
      .from('domain_categories')
      .select('domain, category');

    // Calculate analytics metrics
    const analyticsData: AnalyticsData = {
      productivityScore: calculateProductivityScore(visitData, tabs),
      timeDistribution: calculateTimeDistribution(visitData, customCategories),
      domainStats: calculateDomainStats(visitData),
      productivityTrends: await calculateProductivityTrends(visitData)
    };

    // Store daily analytics data in Supabase
    const { error: storeError } = await supabase
      .from('analytics_data')
      .upsert({
        date: new Date().toISOString().split('T')[0],
        productivity_score: analyticsData.productivityScore,
        total_time_spent: visitData.reduce((sum, visit) => sum + visit.timeSpent, 0),
        domain_stats: analyticsData.domainStats,
        category_distribution: analyticsData.timeDistribution
      });

    if (storeError) {
      console.error("Error storing analytics data:", storeError);
      toast.error("Failed to store analytics data");
    }

    // Validate analytics data
    validateAnalyticsData(analyticsData);

    return analyticsData;
  } catch (error) {
    console.error("Error getting analytics data:", error);
    toast.error("Failed to load analytics data. Please try again.");
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

const calculateTimeDistribution = async (visitData: VisitData[], customCategories: DomainCategory[] | null): Promise<TimeDistributionData[]> => {
  const categories = new Map<string, number>();
  
  visitData.forEach(visit => {
    const customCategory = customCategories?.find(c => c.domain === visit.domain);
    const category = customCategory?.category || determineCategory(visit.domain);
    const current = categories.get(category) || 0;
    categories.set(category, current + visit.timeSpent);
  });

  return Array.from(categories.entries())
    .map(([category, time]) => ({ category, time }));
};

const calculateProductivityScore = (visitData: VisitData[], tabs: chrome.tabs.Tab[]): number => {
  try {
    const factors = {
      tabEfficiency: calculateTabEfficiency(tabs),
      browsingFocus: calculateBrowsingFocus(visitData),
      timeManagement: calculateTimeManagement(visitData)
    };

    const score = Math.round(
      (factors.tabEfficiency + factors.browsingFocus + factors.timeManagement) / 3 * 100
    );

    // Validate score
    if (isNaN(score) || score < 0 || score > 100) {
      throw new Error("Invalid productivity score calculation");
    }

    return score;
  } catch (error) {
    console.error("Error calculating productivity score:", error);
    toast.error("Error calculating productivity score");
    return 0;
  }
};

const calculateProductivityTrends = async (visitData: VisitData[]): Promise<ProductivityTrend[]> => {
  try {
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

      const score = calculateDailyProductivityScore(dayData);
      
      // Validate score
      if (isNaN(score) || score < 0 || score > 100) {
        throw new Error(`Invalid daily productivity score for ${date}`);
      }

      trends.push({
        date: date.toISOString().split('T')[0],
        score
      });
    }

    return trends.reverse();
  } catch (error) {
    console.error("Error calculating productivity trends:", error);
    toast.error("Error calculating productivity trends");
    return [];
  }
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

const validateAnalyticsData = (data: AnalyticsData): void => {
  if (
    !data.productivityScore ||
    !Array.isArray(data.timeDistribution) ||
    !Array.isArray(data.domainStats) ||
    !Array.isArray(data.productivityTrends)
  ) {
    throw new Error("Invalid analytics data structure");
  }

  if (data.productivityScore < 0 || data.productivityScore > 100) {
    throw new Error("Invalid productivity score");
  }

  // Validate time distribution
  data.timeDistribution.forEach(item => {
    if (!item.category || typeof item.time !== 'number') {
      throw new Error("Invalid time distribution data");
    }
  });

  // Validate domain stats
  data.domainStats.forEach(item => {
    if (!item.domain || typeof item.visits !== 'number' || typeof item.timeSpent !== 'number') {
      throw new Error("Invalid domain stats data");
    }
  });

  // Validate productivity trends
  data.productivityTrends.forEach(item => {
    if (!item.date || typeof item.score !== 'number') {
      throw new Error("Invalid productivity trends data");
    }
  });
};
