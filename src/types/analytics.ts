
export interface AnalyticsData {
  productivityScore: number;
  timeDistribution: TimeDistributionData[];
  domainStats: DomainStat[];
  productivityTrends: ProductivityTrend[];
  // For legacy compatibility with fetchAnalyticsData
  totalBookmarks?: number;
  bookmarksThisWeek?: number;
  bookmarksToday?: number;
  topDomains?: { domain: string; count: number }[];
  trendData?: DailyAnalytics[];
}

export interface TimeDistributionData {
  category: string;
  time: number;
}

export interface DomainStat {
  domain: string;
  visits: number;
  timeSpent: number;
}

export interface ProductivityTrend {
  date: string;
  score: number;
}

export interface VisitData {
  url: string;
  domain: string;
  visitCount: number;
  timeSpent: number;
  lastVisitTime: number;
}

export interface AnalyticsGoal {
  id: string;
  category: string;
  targetHours: number;
  currentHours: number;
  startDate: Date;
  endDate: Date;
}

export interface DomainCategory {
  domain: string;
  category: string;
}

export interface DailyAnalytics {
  date: string;
  count: number;
}
