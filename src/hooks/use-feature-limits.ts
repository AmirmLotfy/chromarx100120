
import { useState, useEffect } from 'react';
import { chromeStorage } from "@/services/chromeStorageService";
import { subscriptionPlans, PlanLimits } from "@/config/subscriptionPlans";
import { useSubscription } from "./use-subscription";
import { createDefaultUsage } from "@/utils/subscriptionUtils";
import { withErrorHandling } from "@/utils/errorUtils";
import { toast } from "sonner";

export interface FeatureLimitsHook {
  remainingUsage: Record<string, number> | null;
  usagePercentage: Record<string, number> | null;
  getFeatureLimit: (featureType: keyof PlanLimits) => number;
  checkLimit: (limitType: keyof PlanLimits) => boolean;
  incrementUsage: (limitType: keyof PlanLimits) => Promise<boolean>;
  showUpgradePrompt: (feature: string) => void;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Convert a limit type key to a user-friendly feature name
 */
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

export const useFeatureLimits = (): FeatureLimitsHook => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [remainingUsage, setRemainingUsage] = useState<Record<string, number> | null>(null);
  const [usagePercentage, setUsagePercentage] = useState<Record<string, number> | null>(null);
  const { subscription, refreshSubscription } = useSubscription();
  
  useEffect(() => {
    const calculateLimits = async () => {
      try {
        setIsLoading(true);
        
        if (!subscription) {
          setRemainingUsage(null);
          setUsagePercentage(null);
          return;
        }
        
        // Get plan limits
        const planLimits = subscriptionPlans.find(p => p.id === subscription.planId)?.limits;
        
        if (planLimits) {
          const remaining: Record<string, number> = {};
          const percentages: Record<string, number> = {};
          
          Object.keys(planLimits).forEach(key => {
            const limitKey = key as keyof typeof planLimits;
            const limit = planLimits[limitKey];
            const used = subscription.usage[limitKey] || 0;
            
            remaining[key] = limit === -1 ? -1 : Math.max(0, limit - used);
            percentages[key] = limit === -1 ? 0 : Math.min(100, Math.round((used / limit) * 100));
          });
          
          setRemainingUsage(remaining);
          setUsagePercentage(percentages);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to calculate usage limits'));
        console.error('Error calculating usage limits:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    calculateLimits();
  }, [subscription]);
  
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
    return withErrorHandling(
      async () => {
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
        
        // Make sure we have a complete usage object with all fields
        const currentUsage = (userData as any).subscription.usage || {};
        const updatedUsage = createDefaultUsage(currentUsage);
        updatedUsage[limitType] = usage + 1;
        
        await chromeStorage.set('user', {
          ...(userData as Record<string, any>),
          subscription: {
            ...((userData as any).subscription),
            usage: updatedUsage
          }
        });
        
        // Refresh the subscription data
        await refreshSubscription();
        
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
      },
      {
        errorMessage: `Failed to update usage for ${limitTypeToFeatureName(limitType)}`,
        showError: true,
        rethrow: false,
        logMetadata: { operation: 'incrementUsage', limitType, currentSubscription: subscription?.planId }
      }
    );
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
  
  return {
    remainingUsage,
    usagePercentage,
    getFeatureLimit,
    checkLimit,
    incrementUsage,
    showUpgradePrompt,
    isLoading,
    error
  };
};

export default useFeatureLimits;
