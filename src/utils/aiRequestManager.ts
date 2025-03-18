
import { chromeStorage } from "@/services/chromeStorageService";
import { toast } from "sonner";
import { PlanLimits, subscriptionPlans } from "@/config/subscriptionPlans";
import { StorageOptions } from "@/services/storage/types";

interface AIRequestOptions {
  requestType: keyof PlanLimits;
  showToasts?: boolean;
  isBackground?: boolean;
  context?: string;
}

interface AIRequestResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  limitExceeded?: boolean;
  remainingRequests?: number;
}

interface AIRequestMetadata {
  timestamp: number;
  requestType: string;
  success: boolean;
  duration: number;
  context?: string;
  error?: string;
}

interface ThrottleCheckResult {
  throttled: boolean;
  reason?: string;
  nextAllowedTime?: Date;
}

/**
 * Manages and tracks AI requests with respect to user limits
 */
class AIRequestManager {
  /**
   * Execute an AI request with limit checking and usage tracking
   */
  async executeRequest<T>(
    requestFn: () => Promise<T>,
    options: AIRequestOptions
  ): Promise<AIRequestResult<T>> {
    const startTime = Date.now();
    const { requestType, showToasts = true, isBackground = false } = options;
    const metadata: AIRequestMetadata = {
      timestamp: startTime,
      requestType: requestType,
      success: false,
      duration: 0,
      context: options.context
    };

    try {
      // Check if user has remaining requests
      const hasRemaining = await this.checkRemainingRequests(requestType);
      
      if (!hasRemaining) {
        if (showToasts && !isBackground) {
          toast.error(`You've reached your monthly limit for this AI feature.`, {
            description: "Upgrade to Pro for unlimited access.",
            action: {
              label: "Upgrade",
              onClick: () => window.location.href = '/plans'
            },
            duration: 8000
          });
        }
        
        metadata.success = false;
        metadata.error = "Usage limit exceeded";
        await this.logRequestMetadata(metadata);
        
        return {
          success: false,
          error: "Usage limit exceeded",
          limitExceeded: true
        };
      }
      
      // Execute the request
      const result = await requestFn();
      
      // Track the usage
      await this.incrementUsage(requestType);
      
      // Get remaining requests after increment
      const remaining = await this.getRemainingRequests(requestType);
      
      // Complete metadata
      metadata.success = true;
      metadata.duration = Date.now() - startTime;
      await this.logRequestMetadata(metadata);
      
      return {
        success: true,
        data: result,
        remainingRequests: remaining
      };
    } catch (error) {
      console.error(`Error in AI request (${requestType}):`, error);
      
      // Complete metadata with error
      metadata.success = false;
      metadata.error = error instanceof Error ? error.message : String(error);
      metadata.duration = Date.now() - startTime;
      await this.logRequestMetadata(metadata);
      
      if (showToasts && !isBackground) {
        toast.error("Failed to process AI request", {
          description: error instanceof Error ? error.message : "Unknown error occurred"
        });
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Check if user has remaining requests for a specific type
   */
  async checkRemainingRequests(requestType: keyof PlanLimits): Promise<boolean> {
    try {
      const userData = await chromeStorage.get<any>('user');
      if (!userData?.subscription) return false;
      
      // Pro users have unlimited requests
      if (userData.subscription.planId === 'pro' && 
          (userData.subscription.status === 'active' || userData.subscription.status === 'grace_period')) {
        return true;
      }
      
      // Get plan limits
      const plan = subscriptionPlans.find(p => p.id === userData.subscription.planId);
      if (!plan) return false;
      
      const limit = plan.limits[requestType];
      if (limit === -1) return true; // Unlimited
      
      const usage = userData.subscription.usage[requestType] || 0;
      return usage < limit;
    } catch (error) {
      console.error('Error checking remaining requests:', error);
      return false;
    }
  }
  
  /**
   * Get number of remaining requests for a specific type
   */
  async getRemainingRequests(requestType: keyof PlanLimits): Promise<number> {
    try {
      const userData = await chromeStorage.get<any>('user');
      if (!userData?.subscription) return 0;
      
      // Pro users have unlimited requests
      if (userData.subscription.planId === 'pro' &&
          (userData.subscription.status === 'active' || userData.subscription.status === 'grace_period')) {
        return -1; // -1 indicates unlimited
      }
      
      // Get plan limits
      const plan = subscriptionPlans.find(p => p.id === userData.subscription.planId);
      if (!plan) return 0;
      
      const limit = plan.limits[requestType];
      if (limit === -1) return -1; // Unlimited
      
      const usage = userData.subscription.usage[requestType] || 0;
      return Math.max(0, limit - usage);
    } catch (error) {
      console.error('Error getting remaining requests:', error);
      return 0;
    }
  }
  
  /**
   * Increment usage counter for a specific request type
   */
  private async incrementUsage(requestType: keyof PlanLimits): Promise<boolean> {
    try {
      const userData = await chromeStorage.get<any>('user');
      if (!userData?.subscription) return false;
      
      // Skip for Pro users (they have unlimited usage)
      if (userData.subscription.planId === 'pro' &&
          (userData.subscription.status === 'active' || userData.subscription.status === 'grace_period')) {
        // Still increment aiRequests for analytics purposes, but don't check limits
        if (requestType !== 'aiRequests') {
          const currentAIRequests = userData.subscription.usage.aiRequests || 0;
          await chromeStorage.set('user', {
            ...userData,
            subscription: {
              ...userData.subscription,
              usage: {
                ...userData.subscription.usage,
                aiRequests: currentAIRequests + 1
              }
            }
          });
        }
        return true;
      }
      
      // Get plan limits
      const plan = subscriptionPlans.find(p => p.id === userData.subscription.planId);
      if (!plan) return false;
      
      // Update the specific request type counter
      const currentUsage = userData.subscription.usage[requestType] || 0;
      
      // Also increment general AI requests counter if this is a specific AI feature
      // and not the general aiRequests counter itself
      let updatedUsage = {
        ...userData.subscription.usage,
        [requestType]: currentUsage + 1
      };
      
      if (requestType !== 'aiRequests') {
        updatedUsage = {
          ...updatedUsage,
          aiRequests: (userData.subscription.usage.aiRequests || 0) + 1
        };
      }
      
      await chromeStorage.set('user', {
        ...userData,
        subscription: {
          ...userData.subscription,
          usage: updatedUsage
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      return false;
    }
  }
  
  /**
   * Log request metadata for analytics
   */
  private async logRequestMetadata(metadata: AIRequestMetadata): Promise<void> {
    try {
      // Get existing logs
      const logs = await chromeStorage.get<AIRequestMetadata[]>('ai_request_logs') || [];
      
      // Add new log entry
      logs.push(metadata);
      
      // Only keep the last 100 logs
      const trimmedLogs = logs.slice(-100);
      
      // Save logs
      await chromeStorage.set('ai_request_logs', trimmedLogs);
    } catch (error) {
      console.error('Error logging request metadata:', error);
    }
  }
  
  /**
   * Get usage statistics for AI requests
   */
  async getUsageStats(): Promise<{
    totalRequests: number;
    successRate: number;
    averageDuration: number;
    requestsByType: Record<string, number>;
  }> {
    try {
      const logs = await chromeStorage.get<AIRequestMetadata[]>('ai_request_logs') || [];
      
      if (logs.length === 0) {
        return {
          totalRequests: 0,
          successRate: 0,
          averageDuration: 0,
          requestsByType: {}
        };
      }
      
      const successfulRequests = logs.filter(log => log.success).length;
      const totalDuration = logs.reduce((sum, log) => sum + log.duration, 0);
      
      // Count requests by type
      const requestsByType: Record<string, number> = {};
      for (const log of logs) {
        requestsByType[log.requestType] = (requestsByType[log.requestType] || 0) + 1;
      }
      
      return {
        totalRequests: logs.length,
        successRate: (successfulRequests / logs.length) * 100,
        averageDuration: totalDuration / logs.length,
        requestsByType
      };
    } catch (error) {
      console.error('Error getting usage stats:', error);
      return {
        totalRequests: 0,
        successRate: 0,
        averageDuration: 0,
        requestsByType: {}
      };
    }
  }
  
  /**
   * Formats an AI request type to a user-friendly string
   */
  formatRequestType(type: keyof PlanLimits): string {
    const formatMap: Record<string, string> = {
      bookmarkCategorization: "Bookmark Categorization",
      bookmarkSummaries: "Page Summary",
      keywordExtraction: "Keyword Extraction",
      taskEstimation: "Task Duration Estimation",
      noteSentimentAnalysis: "Note Sentiment Analysis",
      aiRequests: "AI Request"
    };
    
    return formatMap[type] || type;
  }

  /**
   * Check if requests are being throttled due to rate limits
   */
  async isThrottled(): Promise<ThrottleCheckResult> {
    try {
      // Get the last request timestamp
      const lastRequestTime = await chromeStorage.get<string>('last_ai_request_time');
      
      if (!lastRequestTime) {
        // No previous requests, not throttled
        await chromeStorage.set('last_ai_request_time', new Date().toISOString());
        return { throttled: false };
      }
      
      const now = new Date();
      const lastRequest = new Date(lastRequestTime);
      const timeDiff = now.getTime() - lastRequest.getTime();
      
      // Rate limit: max 1 request per second for free users
      const userData = await chromeStorage.get<any>('user');
      const isPro = userData?.subscription?.planId === 'pro' && 
                   (userData?.subscription?.status === 'active' || 
                    userData?.subscription?.status === 'grace_period');
      
      // Pro users get higher rate limits
      const minTimeBetweenRequests = isPro ? 200 : 1000; // 0.2s for Pro, 1s for Free
      
      if (timeDiff < minTimeBetweenRequests) {
        const nextAllowedTime = new Date(lastRequest.getTime() + minTimeBetweenRequests);
        return { 
          throttled: true, 
          reason: `Rate limited. Please wait ${Math.ceil((minTimeBetweenRequests - timeDiff) / 1000)} seconds`,
          nextAllowedTime
        };
      }
      
      // Not throttled, update last request time
      await chromeStorage.set('last_ai_request_time', now.toISOString());
      return { throttled: false };
    } catch (error) {
      console.error('Error checking throttle:', error);
      return { throttled: false }; // Default to not throttled on error
    }
  }

  /**
   * Make an AI request with caching
   */
  async makeRequest<T>(
    requestFn: () => Promise<T>,
    cacheKey: string,
    fallbackMessage: string = "Sorry, I couldn't process that request"
  ): Promise<T | string> {
    try {
      // Check cache
      const cachedResponse = await chromeStorage.get<T>(`ai_cache_${cacheKey}`);
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Execute request
      const result = await requestFn();
      
      // Cache the result (for 24 hours)
      const storageOptions: StorageOptions = { ttl: 24 * 60 * 60 * 1000 };
      await chromeStorage.set(`ai_cache_${cacheKey}`, result, storageOptions);
      
      return result;
    } catch (error) {
      console.error(`AI request error (${cacheKey}):`, error);
      return fallbackMessage;
    }
  }
}

// Export a singleton instance
export const aiRequestManager = new AIRequestManager();
