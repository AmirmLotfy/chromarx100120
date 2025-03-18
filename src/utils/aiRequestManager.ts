
import { cache } from "./cacheUtils";
import { toast } from "sonner";
import { chromeStorage } from "@/services/chromeStorageService";
import { usageTracker } from "./usageTracker";

interface RequestQuota {
  count: number;
  resetTime: number;
  lastRequestTime: number;
}

interface AIResponse {
  result: string;
  timestamp: number;
}

interface UserSubscription {
  planId: string;
  status: string;
}

// Cache for AI responses
const aiResponseCache = new Map<string, AIResponse>();

// Constants
const MIN_REQUEST_INTERVAL_MS = 1000; // Minimum time between requests (1 second)
const quotaKey = 'ai_request_quota';

class AIRequestManager {
  private static instance: AIRequestManager;
  private quota: RequestQuota | null = null;
  private currentPlan: string = 'free';
  private subscription: UserSubscription | null = null;

  private constructor() {
    // Load current plan asynchronously
    this.loadCurrentPlan();
  }

  static getInstance(): AIRequestManager {
    if (!AIRequestManager.instance) {
      AIRequestManager.instance = new AIRequestManager();
    }
    return AIRequestManager.instance;
  }

  private async loadCurrentPlan(): Promise<void> {
    try {
      const userData = await chromeStorage.get('user') || {};
      const subscription = userData.subscription;
      
      if (subscription) {
        this.currentPlan = subscription.planId;
        this.subscription = subscription;
      }
    } catch (error) {
      console.error('Error loading current plan:', error);
    }
  }

  private getPlanLimits(): { daily: number; hourly: number } {
    // These should align with our subscription plans
    switch (this.currentPlan) {
      case 'pro':
        return { daily: -1, hourly: -1 }; // Unlimited
      case 'free':
      default:
        return { daily: 10, hourly: 5 };
    }
  }

  private async getQuota(): Promise<RequestQuota> {
    if (this.quota) {
      return this.quota;
    }

    const storedQuota = await cache.get<RequestQuota>(quotaKey);

    if (!storedQuota) {
      return { 
        count: 0, 
        resetTime: Date.now() + 24 * 60 * 60 * 1000,
        lastRequestTime: 0
      };
    }

    this.quota = storedQuota;
    return storedQuota;
  }

  private async updateQuota(): Promise<{success: boolean; message?: string}> {
    // Reload the current plan and subscription before checking
    await this.loadCurrentPlan();
    
    // Check if user has reached their monthly AI request limit
    const canUseAI = await usageTracker.checkLimit('aiRequests');
    if (!canUseAI) {
      return {
        success: false,
        message: "You've reached your monthly AI request limit. Upgrade to Pro for unlimited AI requests."
      };
    }
    
    const limits = this.getPlanLimits();
    let quota = await this.getQuota();
    const now = Date.now();

    // Unlimited plan handling
    if (limits.daily === -1) {
      // Just update the last request time but don't increment count
      this.quota = {
        ...quota,
        lastRequestTime: now
      };
      await cache.set(quotaKey, this.quota);
      
      return { success: true };
    }

    // Check if we've passed the reset time
    if (now > quota.resetTime) {
      quota = { 
        count: 1, 
        resetTime: now + 24 * 60 * 60 * 1000,
        lastRequestTime: now 
      };
    } else {
      // Check for rate limiting
      if (quota.count >= limits.daily) {
        return {
          success: false,
          message: "Daily AI request quota exceeded. Please try again tomorrow or upgrade your plan."
        };
      }

      // Check for hourly quota
      if (limits.hourly > 0) {
        const hourlyRequests = quota.count % limits.hourly;
        if (hourlyRequests >= limits.hourly && 
            now - quota.lastRequestTime < 60 * 60 * 1000) {
          return {
            success: false,
            message: "Hourly AI request quota exceeded. Please try again later or upgrade your plan."
          };
        }
      }

      // Check for request throttling
      if (now - quota.lastRequestTime < MIN_REQUEST_INTERVAL_MS) {
        return {
          success: false,
          message: "Please wait a moment before sending another request."
        };
      }

      quota = { 
        ...quota, 
        count: quota.count + 1,
        lastRequestTime: now 
      };
    }

    this.quota = quota;
    await cache.set(quotaKey, quota);
    
    // Increment usage counter in subscription
    await usageTracker.incrementUsage('aiRequests');
    
    return { success: true };
  }

  async getCachedResponse(key: string): Promise<string | null> {
    const cachedResponse = aiResponseCache.get(key);
    if (cachedResponse) {
      const { result, timestamp } = cachedResponse;
      // Cache valid for 24 hours
      if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
        return result;
      } else {
        aiResponseCache.delete(key); // Remove expired cache
        return null;
      }
    }
    return null;
  }

  async cacheResponse(key: string, result: string): Promise<void> {
    aiResponseCache.set(key, { result, timestamp: Date.now() });
  }

  async makeRequest<T>(
    requestFn: () => Promise<T>,
    cacheKey?: string,
    fallbackValue?: T,
    usageType: keyof PlanLimits = 'aiRequests' 
  ): Promise<T> {
    try {
      // Reload current plan before making request
      await this.loadCurrentPlan();
      
      // Check cache first if a cache key is provided
      if (cacheKey) {
        const cached = await this.getCachedResponse(cacheKey);
        if (cached) {
          return JSON.parse(cached) as T;
        }
      }

      // Check if user has reached their limit for this specific usage type
      const canUseFeature = await usageTracker.checkLimit(usageType);
      if (!canUseFeature) {
        throw new Error(`You've reached your ${formatUsageType(usageType)} limit. Upgrade to Pro for unlimited access.`);
      }

      // Update quota and check for rate limiting
      const quotaCheck = await this.updateQuota();
      if (!quotaCheck.success) {
        toast.error(quotaCheck.message || "Rate limit exceeded", {
          action: {
            label: "Upgrade",
            onClick: () => window.location.href = "/plans"
          }
        });
        throw new Error(quotaCheck.message || "Quota exceeded");
      }

      // Increment usage counter for this specific feature
      await usageTracker.incrementUsage(usageType);

      // Make the actual request
      const result = await requestFn();

      // Cache the result if a cache key is provided
      if (cacheKey && result) {
        await this.cacheResponse(cacheKey, JSON.stringify(result));
      }

      return result;
    } catch (error) {
      console.error("AI request failed:", error);
      
      // Show error message to user
      toast.error(error instanceof Error ? error.message : "Failed to process request", {
        action: {
          label: "Upgrade",
          onClick: () => window.location.href = "/plans"
        }
      });
      
      // Use fallback value if provided
      if (fallbackValue !== undefined) {
        console.log("Using fallback value");
        return fallbackValue;
      }
      
      throw error;
    }
  }

  getRemainingQuota = async (): Promise<{ daily: number; hourly: number; monthly: number }> => {
    // Reload current plan
    await this.loadCurrentPlan();
    
    const limits = this.getPlanLimits();
    
    // If user has unlimited quota, return that info
    if (limits.daily === -1) {
      return { daily: -1, hourly: -1, monthly: -1 };
    }
    
    const quota = await this.getQuota();
    
    // Calculate daily and hourly remaining quota
    const hourlyRequests = quota.count % limits.hourly;
    const hoursSinceLastRequest = (Date.now() - quota.lastRequestTime) / (60 * 60 * 1000);
    
    // Get monthly remaining from usage tracker
    const monthlyRemaining = await usageTracker.getRemainingUsage('aiRequests');
    
    // If it's been more than an hour, reset hourly quota
    const hourlyRemaining = hoursSinceLastRequest > 1 ? 
      limits.hourly : 
      Math.max(0, limits.hourly - hourlyRequests);
    
    return {
      daily: Math.max(0, limits.daily - quota.count),
      hourly: hourlyRemaining,
      monthly: monthlyRemaining
    };
  };

  // Method to check if we're throttled without incrementing counter
  async isThrottled(): Promise<{throttled: boolean; reason?: string}> {
    // Reload current plan
    await this.loadCurrentPlan();
    
    // Check if user has reached monthly limit
    const canUseAI = await usageTracker.checkLimit('aiRequests');
    if (!canUseAI) {
      return {
        throttled: true,
        reason: "Monthly AI request limit reached, upgrade to Pro for unlimited access"
      };
    }
    
    const limits = this.getPlanLimits();
    
    // Unlimited plan is never throttled
    if (limits.daily === -1) {
      return { throttled: false };
    }
    
    const quota = await this.getQuota();
    const now = Date.now();
    
    if (quota.count >= limits.daily) {
      return {
        throttled: true,
        reason: "Daily quota exceeded"
      };
    }
    
    if (limits.hourly > 0) {
      const hourlyRequests = quota.count % limits.hourly;
      if (hourlyRequests >= limits.hourly && 
          now - quota.lastRequestTime < 60 * 60 * 1000) {
        return {
          throttled: true,
          reason: "Hourly quota exceeded"
        };
      }
    }
    
    if (now - quota.lastRequestTime < MIN_REQUEST_INTERVAL_MS) {
      return {
        throttled: true,
        reason: "Request too frequent"
      };
    }
    
    return { throttled: false };
  }
}

// Helper function to format usage type for display
function formatUsageType(usageType: keyof PlanLimits): string {
  const formatMap: Record<string, string> = {
    bookmarks: 'bookmark storage',
    bookmarkImports: 'bookmark import',
    bookmarkCategorization: 'bookmark categorization',
    bookmarkSummaries: 'page summary',
    keywordExtraction: 'keyword extraction',
    tasks: 'task',
    taskEstimation: 'task estimation',
    notes: 'note',
    noteSentimentAnalysis: 'sentiment analysis',
    aiRequests: 'AI request'
  };
  
  return formatMap[usageType] || usageType;
}

export type { PlanLimits };
export const aiRequestManager = AIRequestManager.getInstance();
