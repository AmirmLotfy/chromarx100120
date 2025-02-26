import { cache } from "./cacheUtils";
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
const aiResponseCache = new Map<string, AIResponse>();

// Quota management
const DAILY_QUOTA = 100;
const HOURLY_QUOTA = 20;
const quotaKey = 'ai_request_quota';

class AIRequestManager {
  private static instance: AIRequestManager;
  private quota: RequestQuota | null = null;

  private constructor() {}

  static getInstance(): AIRequestManager {
    if (!AIRequestManager.instance) {
      AIRequestManager.instance = new AIRequestManager();
    }
    return AIRequestManager.instance;
  }

  private async getQuota(): Promise<RequestQuota> {
    if (this.quota) {
      return this.quota;
    }

    const storedQuota = await cache.get<RequestQuota>(quotaKey);

    if (!storedQuota) {
      return { count: 0, resetTime: Date.now() + 24 * 60 * 60 * 1000 };
    }

    this.quota = storedQuota;
    return storedQuota;
  }

  private async updateQuota(): Promise<boolean> {
    let quota = await this.getQuota();
    const now = Date.now();

    if (now > quota.resetTime) {
      quota = { count: 1, resetTime: now + 24 * 60 * 60 * 1000 };
    } else {
      if (quota.count >= DAILY_QUOTA) {
        toast.error("Daily AI request quota exceeded. Please try again tomorrow.");
        return false;
      }
      quota = { ...quota, count: quota.count + 1 };
    }

    this.quota = quota;
    await cache.set(quotaKey, quota);
    return true;
  }

  async getCachedResponse(key: string): Promise<string | null> {
    const cachedResponse = aiResponseCache.get(key);
    if (cachedResponse) {
      const { result, timestamp } = cachedResponse;
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
    fallbackValue?: T
  ): Promise<T> {
    try {
      if (!await this.updateQuota()) {
        throw new Error("Quota exceeded");
      }

      if (cacheKey) {
        const cached = await this.getCachedResponse(cacheKey);
        if (cached) {
          return JSON.parse(cached) as T;
        }
      }

      const result = await requestFn();

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
