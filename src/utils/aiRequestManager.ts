
import { LocalCache } from "./cacheUtils";
import { toast } from "sonner";

interface RequestQuota {
  count: number;
  resetTime: number;
}

interface AIResponse {
  result: string;
  timestamp: number;
}

// Cache for AI responses
const aiResponseCache = new LocalCache<Record<string, AIResponse>>('ai-responses', 24 * 60 * 60 * 1000); // 24 hours

// Quota management
const DAILY_QUOTA = 100;
const HOURLY_QUOTA = 20;
const quotaKey = 'ai_request_quota';

class AIRequestManager {
  private static instance: AIRequestManager;
  private quotaCache: LocalCache<RequestQuota>;

  private constructor() {
    this.quotaCache = new LocalCache<RequestQuota>(quotaKey, 24 * 60 * 60 * 1000);
  }

  static getInstance(): AIRequestManager {
    if (!AIRequestManager.instance) {
      AIRequestManager.instance = new AIRequestManager();
    }
    return AIRequestManager.instance;
  }

  private async getQuota(): Promise<RequestQuota> {
    const quota = this.quotaCache.get();
    if (!quota) {
      return { count: 0, resetTime: Date.now() + 24 * 60 * 60 * 1000 };
    }
    return quota;
  }

  private async updateQuota(): Promise<boolean> {
    const quota = await this.getQuota();
    const now = Date.now();

    // Reset quota if time expired
    if (now > quota.resetTime) {
      this.quotaCache.set({ count: 1, resetTime: now + 24 * 60 * 60 * 1000 });
      return true;
    }

    // Check quotas
    if (quota.count >= DAILY_QUOTA) {
      toast.error("Daily AI request quota exceeded. Please try again tomorrow.");
      return false;
    }

    // Update quota
    this.quotaCache.set({ ...quota, count: quota.count + 1 });
    return true;
  }

  async getCachedResponse(key: string): Promise<string | null> {
    const cache = aiResponseCache.get();
    if (cache?.[key]) {
      const { result, timestamp } = cache[key];
      // Check if cache is still valid (24 hours)
      if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
        return result;
      }
    }
    return null;
  }

  async cacheResponse(key: string, result: string): Promise<void> {
    const cache = aiResponseCache.get() || {};
    cache[key] = { result, timestamp: Date.now() };
    aiResponseCache.set(cache);
  }

  async makeRequest<T>(
    requestFn: () => Promise<T>,
    cacheKey?: string,
    fallbackValue?: T
  ): Promise<T> {
    try {
      // Check quota first
      if (!await this.updateQuota()) {
        throw new Error("Quota exceeded");
      }

      // Check cache if cacheKey provided
      if (cacheKey) {
        const cached = await this.getCachedResponse(cacheKey);
        if (cached) {
          return cached as T;
        }
      }

      // Make the actual request
      const result = await requestFn();

      // Cache the result if cacheKey provided
      if (cacheKey && result) {
        await this.cacheResponse(cacheKey, JSON.stringify(result));
      }

      return result;
    } catch (error) {
      console.error("AI request failed:", error);
      
      if (fallbackValue !== undefined) {
        console.log("Using fallback value");
        return fallbackValue;
      }
      
      throw error;
    }
  }

  getRemainingQuota = async (): Promise<{ daily: number; hourly: number }> => {
    const quota = await this.getQuota();
    return {
      daily: DAILY_QUOTA - quota.count,
      hourly: HOURLY_QUOTA - quota.count
    };
  };
}

export const aiRequestManager = AIRequestManager.getInstance();
