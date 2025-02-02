import { extractDomain } from './domainUtils';

export interface VisitData {
  url: string;
  domain: string;
  visitCount: number;
  timeSpent: number; // in minutes
  lastVisitTime: number;
}

export interface DomainStats {
  domain: string;
  visitCount: number;
  timeSpent: number;
  category: string;
}

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

const getMockHistoryData = (): VisitData[] => [
  { url: 'https://example.com', domain: 'example.com', visitCount: 15, timeSpent: 30, lastVisitTime: Date.now() },
  { url: 'https://work.com', domain: 'work.com', visitCount: 12, timeSpent: 45, lastVisitTime: Date.now() },
  { url: 'https://social.com', domain: 'social.com', visitCount: 8, timeSpent: 20, lastVisitTime: Date.now() }
];

export const calculateProductivityScore = (visits: VisitData[]): number => {
  if (visits.length === 0) return 0;

  const totalVisits = visits.reduce((sum, visit) => sum + visit.visitCount, 0);
  const workRelatedDomains = visits.filter(visit => 
    visit.domain.includes('docs') || 
    visit.domain.includes('github') || 
    visit.domain.includes('stackoverflow')
  );
  
  const workVisits = workRelatedDomains.reduce((sum, visit) => sum + visit.visitCount, 0);
  return Math.round((workVisits / totalVisits) * 100);
};