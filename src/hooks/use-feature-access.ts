
import { useState, useEffect } from 'react';
import { useSubscription } from "./use-subscription";
import { useFeatureLimits } from "./use-feature-limits";
import { PlanLimits } from "@/config/subscriptionPlans";

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
  
  const { subscription, isSubscriptionActive, isProPlan } = useSubscription();
  const { 
    remainingUsage, 
    usagePercentage, 
    getFeatureLimit, 
    checkLimit, 
    incrementUsage, 
    showUpgradePrompt,
    error: limitsError
  } = useFeatureLimits();

  useEffect(() => {
    const determineFeatureAccess = async () => {
      try {
        setIsLoading(true);
        
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
        const isPro = isProPlan();
                     
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
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch feature access'));
        console.error('Error fetching feature access:', err);
      } finally {
        setIsLoading(false);
      }
    };

    determineFeatureAccess();
  }, [subscription, isProPlan]);

  // Merge errors from dependencies
  useEffect(() => {
    if (limitsError) {
      setError(limitsError);
    }
  }, [limitsError]);

  const hasAccess = (featureName: string): boolean => {
    return features[featureName] ?? false;
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
