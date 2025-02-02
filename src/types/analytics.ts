export interface AnalyticsData {
  productivityScore: number;
  timeDistribution: TimeDistributionData[];
  domainStats: DomainStat[];
  productivityTrends: ProductivityTrend[];
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