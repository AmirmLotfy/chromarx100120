import { auth } from "@/lib/chrome-utils";
import { VisitData } from "@/types/analytics";

export const getHistoryData = async (startTime: number): Promise<VisitData[]> => {
  if (typeof chrome === 'undefined' || !chrome.history) {
    console.log('[DEV MODE] Using mock history data');
    return getMockHistoryData();
  }

  try {
    const historyItems = await chrome.history.search({
      text: '',
      startTime,
      maxResults: 1000
    });

    const visits: VisitData[] = [];
    const domains = new Map<string, VisitData>();

    for (const item of historyItems) {
      if (!item.url) continue;
      
      const domain = extractDomain(item.url);
      const existing = domains.get(domain);

      if (existing) {
        existing.visitCount += item.visitCount || 1;
        existing.timeSpent += (item.visitCount || 1) * 2; // Estimate 2 minutes per visit
        existing.lastVisitTime = Math.max(existing.lastVisitTime, item.lastVisitTime || 0);
      } else {
        domains.set(domain, {
          url: item.url,
          domain,
          visitCount: item.visitCount || 1,
          timeSpent: (item.visitCount || 1) * 2,
          lastVisitTime: item.lastVisitTime || 0
        });
      }
    }

    return Array.from(domains.values());
  } catch (error) {
    console.error('Error fetching history:', error);
    return getMockHistoryData();
  }
};

export const calculateProductivityScore = (visits: VisitData[]): number => {
  if (visits.length === 0) return 0;

  const productiveKeywords = ['docs', 'github', 'stackoverflow', 'learn', 'course', 'study'];
  const unproductiveKeywords = ['social', 'game', 'entertainment', 'video'];

  let productiveTime = 0;
  let totalTime = 0;

  visits.forEach(visit => {
    const domain = visit.domain.toLowerCase();
    const isProductive = productiveKeywords.some(keyword => domain.includes(keyword));
    const isUnproductive = unproductiveKeywords.some(keyword => domain.includes(keyword));

    if (isProductive) {
      productiveTime += visit.timeSpent;
    }
    totalTime += visit.timeSpent;
  });

  return Math.round((productiveTime / totalTime) * 100) || 0;
};

const extractDomain = (url: string): string => {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '');
  } catch {
    return url;
  }
};

const getMockHistoryData = (): VisitData[] => [
  { url: 'https://github.com', domain: 'github.com', visitCount: 15, timeSpent: 30, lastVisitTime: Date.now() },
  { url: 'https://stackoverflow.com', domain: 'stackoverflow.com', visitCount: 12, timeSpent: 45, lastVisitTime: Date.now() },
  { url: 'https://youtube.com', domain: 'youtube.com', visitCount: 8, timeSpent: 20, lastVisitTime: Date.now() }
];

export const generateAITips = async (visits: VisitData[]): Promise<string[]> => {
  try {
    const user = await auth.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // For now, return default tips since we don't have the AI service integrated
    return getDefaultTips();
  } catch (error) {
    console.error('Error generating AI tips:', error);
    return getDefaultTips();
  }
};

const getDefaultTips = () => [
  "Consider using website blockers during focused work hours to minimize distractions.",
  "Try the Pomodoro Technique: 25 minutes of focused work followed by a 5-minute break.",
  "Set specific time blocks for checking social media and entertainment sites."
];