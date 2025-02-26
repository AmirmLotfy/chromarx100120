
import { AnalyticsData, DomainStat, TimeDistributionData, ProductivityTrend } from "@/types/analytics";
import { z } from "zod";

// Validation schemas with required fields to match TypeScript interfaces
const domainStatSchema = z.object({
  domain: z.string().min(1),
  visits: z.number().int().nonnegative(),
  timeSpent: z.number().int().nonnegative()
});

const timeDistributionSchema = z.object({
  category: z.string().min(1),
  time: z.number().nonnegative()
});

const productivityTrendSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  score: z.number().min(0).max(100)
});

const analyticsDataSchema = z.object({
  productivityScore: z.number().min(0).max(100),
  timeDistribution: z.array(timeDistributionSchema),
  domainStats: z.array(domainStatSchema),
  productivityTrends: z.array(productivityTrendSchema)
});

// Validation functions
export const validateAnalyticsData = (data: unknown): AnalyticsData => {
  const validatedData = analyticsDataSchema.parse(data);
  return {
    productivityScore: validatedData.productivityScore,
    timeDistribution: validatedData.timeDistribution,
    domainStats: validatedData.domainStats,
    productivityTrends: validatedData.productivityTrends
  };
};

export const validateDomainStats = (stats: unknown): DomainStat[] => {
  const validatedStats = z.array(domainStatSchema).parse(stats);
  return validatedStats.map(stat => ({
    domain: stat.domain,
    visits: stat.visits,
    timeSpent: stat.timeSpent
  }));
};

export const validateTimeDistribution = (distribution: unknown): TimeDistributionData[] => {
  const validatedDistribution = z.array(timeDistributionSchema).parse(distribution);
  return validatedDistribution.map(item => ({
    category: item.category,
    time: item.time
  }));
};

export const validateProductivityTrends = (trends: unknown): ProductivityTrend[] => {
  const validatedTrends = z.array(productivityTrendSchema).parse(trends);
  return validatedTrends.map(trend => ({
    date: trend.date,
    score: trend.score
  }));
};
