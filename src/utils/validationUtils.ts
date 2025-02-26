
import { AnalyticsData, DomainStat, TimeDistributionData, ProductivityTrend } from "@/types/analytics";
import { z } from "zod";

// Define strict schemas that match our TypeScript interfaces exactly
const domainStatSchema = z.object({
  domain: z.string().min(1),
  visits: z.number().int().nonnegative(),
  timeSpent: z.number().int().nonnegative()
}).strict();

const timeDistributionSchema = z.object({
  category: z.string().min(1),
  time: z.number().nonnegative()
}).strict();

const productivityTrendSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  score: z.number().min(0).max(100)
}).strict();

const analyticsDataSchema = z.object({
  productivityScore: z.number().min(0).max(100),
  timeDistribution: z.array(timeDistributionSchema),
  domainStats: z.array(domainStatSchema),
  productivityTrends: z.array(productivityTrendSchema)
}).strict();

// Type the intermediate validation results
export const validateAnalyticsData = (data: unknown): AnalyticsData => {
  const validatedData = analyticsDataSchema.parse(data) as {
    productivityScore: number;
    timeDistribution: { category: string; time: number }[];
    domainStats: { domain: string; visits: number; timeSpent: number }[];
    productivityTrends: { date: string; score: number }[];
  };

  // Construct a properly typed object
  const result: AnalyticsData = {
    productivityScore: validatedData.productivityScore,
    timeDistribution: validatedData.timeDistribution.map(item => ({
      category: item.category,
      time: item.time
    })),
    domainStats: validatedData.domainStats.map(stat => ({
      domain: stat.domain,
      visits: stat.visits,
      timeSpent: stat.timeSpent
    })),
    productivityTrends: validatedData.productivityTrends.map(trend => ({
      date: trend.date,
      score: trend.score
    }))
  };

  return result;
};

export const validateDomainStats = (stats: unknown): DomainStat[] => {
  const validatedStats = z.array(domainStatSchema).parse(stats) as {
    domain: string;
    visits: number;
    timeSpent: number;
  }[];

  return validatedStats.map(stat => ({
    domain: stat.domain,
    visits: stat.visits,
    timeSpent: stat.timeSpent
  }));
};

export const validateTimeDistribution = (distribution: unknown): TimeDistributionData[] => {
  const validatedDistribution = z.array(timeDistributionSchema).parse(distribution) as {
    category: string;
    time: number;
  }[];

  return validatedDistribution.map(item => ({
    category: item.category,
    time: item.time
  }));
};

export const validateProductivityTrends = (trends: unknown): ProductivityTrend[] => {
  const validatedTrends = z.array(productivityTrendSchema).parse(trends) as {
    date: string;
    score: number;
  }[];

  return validatedTrends.map(trend => ({
    date: trend.date,
    score: trend.score
  }));
};
