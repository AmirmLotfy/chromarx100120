
import { useState, useEffect } from 'react';
import { chromeStorage } from "@/services/chromeStorageService";
import { toast } from "sonner";
import { subscriptionPlans, PlanLimits } from "@/config/subscriptionPlans";
import { useSubscription } from "./use-subscription";

export interface FeatureAccessHook {
  hasAccess: (featureName: string) => boolean;
  checkAccess: (featureName: string) => boolean; // Alias for hasAccess for compatibility
  isLoading: boolean;
  error: Error | null;
  remainingUsage: Record<string, number> | null;
  usagePercentage: Record<string, number> | null;
  isFeatureEnabled: (feature: string) => boolean; // For compatibility
  getFeatureLimit: (featureType: keyof PlanLimits) => number;
  checkLimit: (limitType: keyof PlanLimits) => boolean;
  incrementUsage: (limitType: keyof PlanLimits) => Promise<boolean>;
  showUpgradePrompt: (feature: string) => void;
}

// For compatibility with existing code
export const useFeaturesEnabled = () => {
  const { hasAccess, isLoading } = useFeatureAccess();
  
  return {
    isEnabled: hasAccess,
    isFeatureEnabled: hasAccess,
    loading: isLoading
  };
};

export const useFeatureAccess = (): FeatureAccessHook => {
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [remainingUsage, setRemainingUsage] = useState<Record<string, number> | null>(null);
  const [usagePercentage, setUsagePercentage] = useState<Record<string, number> | null>(null);
  const { subscription, isSubscriptionActive, isProPlan } = useSubscription();

  useEffect(() => {
    const fetchFeatureAccess = async () => {
      try {
        setIsLoading(true);
        
        // Get user data including subscription
        const userData = await chromeStorage.get('user') || {};
        
        // Use the subscription from the hook or fallback to storage
        const sub = subscription || ((userData as any)?.subscription) || {
          planId: 'free',
          status: 'active',
          usage: {
            bookmarks: 0,
            bookmarkImports: 0,
            bookmarkCategorization: 0,
            bookmarkSummaries: 0,
            keywordExtraction: 0,
            tasks: 0,
            taskEstimation: 0,
            notes: 0,
            noteSentimentAnalysis: 0,
            aiRequests: 0
          }
        };
        
        // Default features everyone has access to
        const defaultFeatures = {
          // Basic organization
          'basic_bookmarks': true,
          'basic_tasks': true,
          'basic_notes': true,
          'basic_chat': true,
          'basic_pomodoro': true,
          'detect_duplicates': true,
          'basic_search': true,
          
          // Basic AI features with limits
          'ai_chat': true,          // Limited in Free
          'ai_categorize': true,    // Limited in Free
          'ai_summarize': true,     // Limited in Free
          'ai_keyword': true,       // Limited in Free
          'ai_sentiment': true,     // Limited in Free
          'ai_task_estimate': true, // Limited in Free
          
          // Basic analytics
          'basic_analytics': true
        };
        
        // Premium features
        const premiumFeatures = {
          // Advanced organization
          'unlimited_bookmarks': false,
          'unlimited_tasks': false,
          'unlimited_notes': false,
          'advanced_search': false,
          'advanced_bookmark_cleanup': false,
          
          // Advanced AI features
          'unlimited_ai': false,
          'unlimited_categorize': false,
          'unlimited_summarize': false,
          'unlimited_keyword': false,
          'unlimited_sentiment': false,
          'unlimited_task_estimate': false,
          
          // Advanced productivity
          'custom_pomodoro': false,
          'time_tracking': false,
          'advanced_task_management': false,
          
          // Advanced analytics
          'domain_insights': false,
          'time_distribution': false,
          'ai_productivity_tips': false
        };
        
        // Determine feature access based on subscription
        const isPro = isProPlan() || (sub.planId === 'pro' && 
                     (sub.status === 'active' || sub.status === 'grace_period'));
                     
        if (isPro) {
          // Pro users get all features
          setFeatures({
            ...defaultFeatures,
            ...Object.fromEntries(Object.keys(premiumFeatures).map(key => [key, true]))
          });
        } else {
          // Free users get only default features
          setFeatures(defaultFeatures);
        }
        
        // Calculate remaining usage
        const planLimits = subscriptionPlans.find(p => p.id === sub.planId)?.limits;
        
        if (planLimits) {
          const remaining: Record<string, number> = {};
          const percentages: Record<string, number> = {};
          
          Object.keys(planLimits).forEach(key => {
            const limitKey = key as keyof typeof planLimits;
            const limit = planLimits[limitKey];
            const used = sub.usage[limitKey] || 0;
            
            remaining[key] = limit === -1 ? -1 : Math.max(0, limit - used);
            percentages[key] = limit === -1 ? 0 : Math.min(100, Math.round((used / limit) * 100));
          });
          
          setRemainingUsage(remaining);
          setUsagePercentage(percentages);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch feature access'));
        console.error('Error fetching feature access:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeatureAccess();
    
    // Set up a subscription change listener
    const checkForSubscriptionChanges = () => {
      fetchFeatureAccess();
    };
    
    // Check for subscription changes every 5 minutes
    const interval = setInterval(checkForSubscriptionChanges, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [subscription, isProPlan]); // Refresh when subscription changes

  const hasAccess = (featureName: string): boolean => {
    return features[featureName] ?? false;
  };
  
  // Get the limit for a specific feature type
  const getFeatureLimit = (featureType: keyof PlanLimits): number => {
    if (!subscription) return 0;
    
    const planLimits = subscriptionPlans.find(p => p.id === subscription.planId)?.limits;
    if (!planLimits) return 0;
    
    return planLimits[featureType];
  };
  
  // Check if user is within limit for a specific feature
  const checkLimit = (limitType: keyof PlanLimits): boolean => {
    if (!subscription) return false;
    
    const planLimits = subscriptionPlans.find(p => p.id === subscription.planId)?.limits;
    if (!planLimits) return false;
    
    const limit = planLimits[limitType];
    if (limit === -1) return true; // Unlimited
    
    const usage = subscription.usage[limitType] || 0;
    return usage < limit;
  };
  
  // Increment usage counter for a specific feature
  const incrementUsage = async (limitType: keyof PlanLimits): Promise<boolean> => {
    try {
      if (!subscription) return false;
      
      const planLimits = subscriptionPlans.find(p => p.id === subscription.planId)?.limits;
      if (!planLimits) return false;
      
      const limit = planLimits[limitType];
      if (limit === -1) return true; // Unlimited
      
      const usage = subscription.usage[limitType] || 0;
      
      if (usage >= limit) {
        showUpgradePrompt(limitTypeToFeatureName(limitType));
        return false;
      }
      
      // Update the usage counter
      const userData = await chromeStorage.get('user') || {};
      if (!((userData as any)?.subscription)) return false;
      
      const updatedUsage = {
        ...((userData as any).subscription.usage),
        [limitType]: usage + 1
      };
      
      await chromeStorage.set('user', {
        ...userData,
        subscription: {
          ...((userData as any).subscription),
          usage: updatedUsage
        }
      });
      
      // If approaching limit (80% or more), show a warning
      if (limit > 0 && (usage + 1) >= limit * 0.8) {
        const percentUsed = Math.round(((usage + 1) / limit) * 100);
        toast.warning(`You've used ${percentUsed}% of your monthly ${limitTypeToFeatureName(limitType)} limit.`, {
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
  };
  
  // Show upgrade prompt for a specific feature
  const showUpgradePrompt = (feature: string): void => {
    toast.error(`You've reached your ${feature} limit. Upgrade to Pro for unlimited access.`, {
      action: {
        label: 'Upgrade',
        onClick: () => window.location.href = '/plans'
      },
      duration: 10000
    });
  };
  
  // Map limit type to user-friendly feature name
  const limitTypeToFeatureName = (limitType: keyof PlanLimits): string => {
    const nameMap: Record<string, string> = {
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
    
    return nameMap[limitType] || limitType;
  };

  return {
    hasAccess,
    checkAccess: hasAccess, // Alias for hasAccess for compatibility
    isFeatureEnabled: hasAccess, // For compatibility
    isLoading,
    error,
    remainingUsage,
    usagePercentage,
    getFeatureLimit,
    checkLimit,
    incrementUsage,
    showUpgradePrompt
  };
};

export default useFeatureAccess;
