
import { AnalyticsData, DomainStat, TimeDistributionData, ProductivityTrend } from "@/types/analytics";
import { z } from "zod";

// Validation schemas
export const domainStatSchema = z.object({
  domain: z.string().min(1),
  visits: z.number().int().nonnegative(),
  timeSpent: z.number().int().nonnegative()
}).required();

export const timeDistributionSchema = z.object({
  category: z.string().min(1),
  time: z.number().nonnegative()
}).required();

export const productivityTrendSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  score: z.number().min(0).max(100)
}).required();

export const analyticsDataSchema = z.object({
  productivityScore: z.number().min(0).max(100),
  timeDistribution: z.array(timeDistributionSchema),
  domainStats: z.array(domainStatSchema),
  productivityTrends: z.array(productivityTrendSchema)
}).required();

// Validation functions
export const validateAnalyticsData = (data: unknown): AnalyticsData => {
  return analyticsDataSchema.parse(data);
};

export const validateDomainStats = (stats: unknown): DomainStat[] => {
  return z.array(domainStatSchema).parse(stats);
};

export const validateTimeDistribution = (distribution: unknown): TimeDistributionData[] => {
  return z.array(timeDistributionSchema).parse(distribution);
};

export const validateProductivityTrends = (trends: unknown): ProductivityTrend[] => {
  return z.array(productivityTrendSchema).parse(trends);
};
