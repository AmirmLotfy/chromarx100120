
import { cache } from "./cacheUtils";
import { toast } from "sonner";

interface RequestQuota {
  count: number;
  resetTime: number;
  lastRequestTime: number;
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
const MIN_REQUEST_INTERVAL_MS = 1000; // Minimum time between requests (1 second)
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
    let quota = await this.getQuota();
    const now = Date.now();

    // Check if we've passed the reset time
    if (now > quota.resetTime) {
      quota = { 
        count: 1, 
        resetTime: now + 24 * 60 * 60 * 1000,
        lastRequestTime: now 
      };
    } else {
      // Check for rate limiting
      if (quota.count >= DAILY_QUOTA) {
        return {
          success: false,
          message: "Daily AI request quota exceeded. Please try again tomorrow."
        };
      }

      // Check for hourly quota
      const hourlyRequests = quota.count % HOURLY_QUOTA;
      if (hourlyRequests >= HOURLY_QUOTA && 
          now - quota.lastRequestTime < 60 * 60 * 1000) {
        return {
          success: false,
          message: "Hourly AI request quota exceeded. Please try again later."
        };
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
    fallbackValue?: T
  ): Promise<T> {
    try {
      // Check cache first if a cache key is provided
      if (cacheKey) {
        const cached = await this.getCachedResponse(cacheKey);
        if (cached) {
          return JSON.parse(cached) as T;
        }
      }

      // Update quota and check for rate limiting
      const quotaCheck = await this.updateQuota();
      if (!quotaCheck.success) {
        toast.error(quotaCheck.message || "Rate limit exceeded");
        throw new Error(quotaCheck.message || "Quota exceeded");
      }

      // Make the actual request
      const result = await requestFn();

      // Cache the result if a cache key is provided
      if (cacheKey && result) {
        await this.cacheResponse(cacheKey, JSON.stringify(result));
      }

      return result;
    } catch (error) {
      console.error("AI request failed:", error);
      
      // Use fallback value if provided
      if (fallbackValue !== undefined) {
        console.log("Using fallback value");
        return fallbackValue;
      }
      
      throw error;
    }
  }

  getRemainingQuota = async (): Promise<{ daily: number; hourly: number }> => {
    const quota = await this.getQuota();
    
    // Calculate daily and hourly remaining quota
    const hourlyRequests = quota.count % HOURLY_QUOTA;
    const hoursSinceLastRequest = (Date.now() - quota.lastRequestTime) / (60 * 60 * 1000);
    
    // If it's been more than an hour, reset hourly quota
    const hourlyRemaining = hoursSinceLastRequest > 1 ? 
      HOURLY_QUOTA : 
      HOURLY_QUOTA - hourlyRequests;
    
    return {
      daily: DAILY_QUOTA - quota.count,
      hourly: hourlyRemaining
    };
  };

  // Method to check if we're throttled without incrementing counter
  async isThrottled(): Promise<{throttled: boolean; reason?: string}> {
    const quota = await this.getQuota();
    const now = Date.now();
    
    if (quota.count >= DAILY_QUOTA) {
      return {
        throttled: true,
        reason: "Daily quota exceeded"
      };
    }
    
    const hourlyRequests = quota.count % HOURLY_QUOTA;
    if (hourlyRequests >= HOURLY_QUOTA && 
        now - quota.lastRequestTime < 60 * 60 * 1000) {
      return {
        throttled: true,
        reason: "Hourly quota exceeded"
      };
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

export const aiRequestManager = AIRequestManager.getInstance();
