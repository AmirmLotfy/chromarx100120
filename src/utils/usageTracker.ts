import { chromeStorage } from "@/services/chromeStorageService";
import { toast } from "sonner";
import { PlanLimits } from "@/config/subscriptionPlans";

interface Usage {
  bookmarks: number;
  bookmarkImports: number;
  bookmarkCategorization: number;
  bookmarkSummaries: number;
  keywordExtraction: number;
  tasks: number;
  taskEstimation: number;
  notes: number;
  noteSentimentAnalysis: number;
  aiRequests: number;
}

interface UserSubscription {
  planId: string;
  status: string;
  usage: Usage;
}

interface UserData {
  subscription?: UserSubscription;
}

/**
 * UsageTracker class to manage usage limits and tracking
 */
class UsageTracker {
  // Check if the user has reached their limit for a specific feature
  async checkLimit(limitType: keyof PlanLimits): Promise<boolean> {
    try {
      const userData = await chromeStorage.get<UserData>('user');
      if (!userData?.subscription) return false;
      
      // Skip limit checks for Pro users
      if (userData.subscription.planId === 'pro' && 
          (userData.subscription.status === 'active' || userData.subscription.status === 'grace_period')) {
        return true;
      }
      
      // Get plan limits
      const planLimits = await this.getPlanLimits(userData.subscription.planId);
      if (!planLimits) return false;
      
      const limit = planLimits[limitType];
      if (limit === -1) return true; // Unlimited
      
      const usage = userData.subscription.usage[limitType] || 0;
      return usage < limit;
    } catch (error) {
      console.error('Error checking usage limit:', error);
      return false;
    }
  }
  
  // Increment usage for a specific feature
  async incrementUsage(limitType: keyof PlanLimits): Promise<boolean> {
    try {
      const userData = await chromeStorage.get<UserData>('user');
      if (!userData?.subscription) return false;
      
      // Skip for Pro users
      if (userData.subscription.planId === 'pro' && 
          (userData.subscription.status === 'active' || userData.subscription.status === 'grace_period')) {
        return true;
      }
      
      // Get plan limits
      const planLimits = await this.getPlanLimits(userData.subscription.planId);
      if (!planLimits) return false;
      
      const limit = planLimits[limitType];
      if (limit === -1) return true; // Unlimited
      
      const usage = userData.subscription.usage[limitType] || 0;
      
      // Check if already at limit
      if (usage >= limit) {
        this.showUpgradePrompt(limitType);
        return false;
      }
      
      // Update usage
      const updatedUsage = {
        ...userData.subscription.usage,
        [limitType]: usage + 1
      };
      
      await chromeStorage.update('user', {
        subscription: {
          ...userData.subscription,
          usage: updatedUsage
        }
      });
      
      // Show warnings at 80% and 90% usage
      const updatedUsageCount = usage + 1;
      const usagePercentage = Math.round((updatedUsageCount / limit) * 100);
      
      if (usagePercentage === 80) {
        toast.warning(`You've used 80% of your monthly ${this.formatLimitName(limitType)} limit.`, {
          action: {
            label: 'Upgrade',
            onClick: () => window.location.href = '/plans'
          },
          duration: 8000
        });
      } else if (usagePercentage === 90) {
        toast.warning(`You've almost reached your monthly ${this.formatLimitName(limitType)} limit.`, {
          action: {
            label: 'Upgrade',
            onClick: () => window.location.href = '/plans'
          },
          duration: 8000
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      return false;
    }
  }
  
  // Get remaining usage for a specific feature
  async getRemainingUsage(limitType: keyof PlanLimits): Promise<number> {
    try {
      const userData = await chromeStorage.get<UserData>('user');
      if (!userData?.subscription) return 0;
      
      // Unlimited for Pro users
      if (userData.subscription.planId === 'pro' && 
          (userData.subscription.status === 'active' || userData.subscription.status === 'grace_period')) {
        return -1; // -1 indicates unlimited
      }
      
      const planLimits = await this.getPlanLimits(userData.subscription.planId);
      if (!planLimits) return 0;
      
      const limit = planLimits[limitType];
      if (limit === -1) return -1; // Unlimited
      
      const usage = userData.subscription.usage[limitType] || 0;
      return Math.max(0, limit - usage);
    } catch (error) {
      console.error('Error getting remaining usage:', error);
      return 0;
    }
  }
  
  // Get usage percentage for a specific feature
  async getUsagePercentage(limitType: keyof PlanLimits): Promise<number> {
    try {
      const userData = await chromeStorage.get<UserData>('user');
      if (!userData?.subscription) return 0;
      
      // Always 0% for Pro users (unlimited)
      if (userData.subscription.planId === 'pro' && 
          (userData.subscription.status === 'active' || userData.subscription.status === 'grace_period')) {
        return 0;
      }
      
      const planLimits = await this.getPlanLimits(userData.subscription.planId);
      if (!planLimits) return 0;
      
      const limit = planLimits[limitType];
      if (limit === -1) return 0; // Unlimited = 0%
      
      const usage = userData.subscription.usage[limitType] || 0;
      return Math.min(100, Math.round((usage / limit) * 100));
    } catch (error) {
      console.error('Error getting usage percentage:', error);
      return 0;
    }
  }
  
  // Get all usage metrics
  async getAllUsageMetrics(): Promise<Record<keyof PlanLimits, { used: number; limit: number; percentage: number }>> {
    try {
      const userData = await chromeStorage.get<UserData>('user');
      if (!userData?.subscription) {
        return {} as Record<keyof PlanLimits, { used: number; limit: number; percentage: number }>;
      }
      
      const planLimits = await this.getPlanLimits(userData.subscription.planId);
      if (!planLimits) {
        return {} as Record<keyof PlanLimits, { used: number; limit: number; percentage: number }>;
      }
      
      const metrics: Record<string, { used: number; limit: number; percentage: number }> = {};
      
      for (const key in planLimits) {
        const limitKey = key as keyof PlanLimits;
        const limit = planLimits[limitKey];
        const used = userData.subscription.usage[limitKey] || 0;
        
        metrics[key] = {
          used,
          limit,
          percentage: limit === -1 ? 0 : Math.min(100, Math.round((used / limit) * 100))
        };
      }
      
      return metrics as Record<keyof PlanLimits, { used: number; limit: number; percentage: number }>;
    } catch (error) {
      console.error('Error getting all usage metrics:', error);
      return {} as Record<keyof PlanLimits, { used: number; limit: number; percentage: number }>;
    }
  }
  
  // Reset monthly usage counters (should be called at the beginning of each month)
  async resetMonthlyUsage(): Promise<boolean> {
    try {
      const userData = await chromeStorage.get<UserData>('user');
      if (!userData?.subscription) return false;
      
      // Keep track of total bookmarks, tasks, and notes (these aren't monthly counters)
      const { bookmarks, tasks, notes } = userData.subscription.usage;
      
      const resetUsage = {
        bookmarks, // Keep total counts
        bookmarkImports: 0, // Reset monthly counters
        bookmarkCategorization: 0,
        bookmarkSummaries: 0,
        keywordExtraction: 0,
        tasks, // Keep total counts
        taskEstimation: 0, // Reset monthly counters
        notes, // Keep total counts
        noteSentimentAnalysis: 0, // Reset monthly counters
        aiRequests: 0
      };
      
      await chromeStorage.update('user', {
        subscription: {
          ...userData.subscription,
          usage: resetUsage
        }
      });
      
      console.log('Monthly usage counters reset');
      return true;
    } catch (error) {
      console.error('Error resetting monthly usage:', error);
      return false;
    }
  }
  
  // Helper method to get plan limits
  private async getPlanLimits(planId: string): Promise<PlanLimits | null> {
    try {
      // Dynamically import to avoid circular dependencies
      const { subscriptionPlans } = await import('@/config/subscriptionPlans');
      const plan = subscriptionPlans.find(p => p.id === planId);
      return plan?.limits || null;
    } catch (error) {
      console.error('Error getting plan limits:', error);
      return null;
    }
  }
  
  // Show upgrade prompt
  private showUpgradePrompt(limitType: keyof PlanLimits): void {
    const featureName = this.formatLimitName(limitType);
    
    toast.error(`You've reached your ${featureName} limit. Upgrade to Pro for unlimited access.`, {
      action: {
        label: 'Upgrade',
        onClick: () => window.location.href = '/plans'
      },
      duration: 10000
    });
  }
  
  // Format limit names for user-friendly display
  private formatLimitName(type: keyof PlanLimits): string {
    const formatMap: Record<keyof PlanLimits, string> = {
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
    
    return formatMap[type] || type.toString();
  }
}

// Export a singleton instance
export const usageTracker = new UsageTracker();
