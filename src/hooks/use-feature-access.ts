
import { useState, useEffect } from 'react';
import { chromeStorage } from "@/services/chromeStorageService";
import { toast } from "sonner";
import { subscriptionPlans } from "@/config/subscriptionPlans";

export interface FeatureAccessHook {
  hasAccess: (featureName: string) => boolean;
  checkAccess: (featureName: string) => boolean; // Alias for hasAccess for compatibility
  isLoading: boolean;
  error: Error | null;
  remainingUsage: Record<string, number> | null;
  usagePercentage: Record<string, number> | null;
  isFeatureEnabled: (feature: string) => boolean; // For compatibility
}

// Define subscription type
interface Subscription {
  planId: string;
  status: string;
  usage: {
    bookmarks: number;
    tasks: number;
    notes: number;
    aiRequests: number;
  };
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

  useEffect(() => {
    const fetchFeatureAccess = async () => {
      try {
        setIsLoading(true);
        
        // Get user data including subscription
        const userData = await chromeStorage.get('user') || {};
        const subscription: Subscription = userData.subscription || {
          planId: 'free',
          status: 'active',
          usage: {
            bookmarks: 0,
            tasks: 0,
            notes: 0,
            aiRequests: 0
          }
        };
        
        // Default features everyone has access to
        const defaultFeatures = {
          'ai_chat': true,
          'notes': true,
          'bookmarks': true,
          'analytics': true,
          'timer': true
        };
        
        // Premium features
        const premiumFeatures = {
          'unlimited_bookmarks': false,
          'unlimited_ai': false,
          'unlimited_notes': false,
          'unlimited_tasks': false,
          'advanced_analytics': false,
          'priority_support': false,
          'offline_access': false,
          'custom_collections': false
        };
        
        // Determine feature access based on subscription
        const isPro = subscription.planId === 'pro' && 
                     (subscription.status === 'active' || subscription.status === 'grace_period');
                     
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
        const planLimits = subscriptionPlans.find(p => p.id === subscription.planId)?.limits;
        
        if (planLimits) {
          setRemainingUsage({
            bookmarks: planLimits.bookmarks === -1 ? -1 : planLimits.bookmarks - (subscription.usage?.bookmarks || 0),
            tasks: planLimits.tasks === -1 ? -1 : planLimits.tasks - (subscription.usage?.tasks || 0),
            notes: planLimits.notes === -1 ? -1 : planLimits.notes - (subscription.usage?.notes || 0),
            aiRequests: planLimits.aiRequests === -1 ? -1 : planLimits.aiRequests - (subscription.usage?.aiRequests || 0)
          });
          
          // Calculate usage percentages
          setUsagePercentage({
            bookmarks: planLimits.bookmarks === -1 ? 0 : Math.min(100, Math.round((subscription.usage?.bookmarks || 0) / planLimits.bookmarks * 100)),
            tasks: planLimits.tasks === -1 ? 0 : Math.min(100, Math.round((subscription.usage?.tasks || 0) / planLimits.tasks * 100)),
            notes: planLimits.notes === -1 ? 0 : Math.min(100, Math.round((subscription.usage?.notes || 0) / planLimits.notes * 100)),
            aiRequests: planLimits.aiRequests === -1 ? 0 : Math.min(100, Math.round((subscription.usage?.aiRequests || 0) / planLimits.aiRequests * 100))
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch feature access'));
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
  }, []);

  const hasAccess = (featureName: string): boolean => {
    // Handle special cases for usage-limited features
    if (featureName === 'create_bookmark' && remainingUsage) {
      if (remainingUsage.bookmarks === -1) return true; // Unlimited
      if (remainingUsage.bookmarks <= 0) {
        toast.error('You have reached your bookmark limit. Upgrade to Pro for unlimited bookmarks.', {
          action: {
            label: 'Upgrade',
            onClick: () => window.location.href = '/plans'
          },
          duration: 10000
        });
        return false;
      }
      return true;
    }
    
    if (featureName === 'create_note' && remainingUsage) {
      if (remainingUsage.notes === -1) return true; // Unlimited
      if (remainingUsage.notes <= 0) {
        toast.error('You have reached your note limit. Upgrade to Pro for unlimited notes.', {
          action: {
            label: 'Upgrade',
            onClick: () => window.location.href = '/plans'
          },
          duration: 10000
        });
        return false;
      }
      return true;
    }
    
    if (featureName === 'create_task' && remainingUsage) {
      if (remainingUsage.tasks === -1) return true; // Unlimited
      if (remainingUsage.tasks <= 0) {
        toast.error('You have reached your task limit. Upgrade to Pro for unlimited tasks.', {
          action: {
            label: 'Upgrade',
            onClick: () => window.location.href = '/plans'
          },
          duration: 10000
        });
        return false;
      }
      return true;
    }
    
    if (featureName === 'use_ai' && remainingUsage) {
      if (remainingUsage.aiRequests === -1) return true; // Unlimited
      if (remainingUsage.aiRequests <= 0) {
        toast.error('You have reached your AI request limit. Upgrade to Pro for unlimited AI requests.', {
          action: {
            label: 'Upgrade',
            onClick: () => window.location.href = '/plans'
          },
          duration: 10000
        });
        return false;
      }
      return true;
    }
    
    // Standard feature access check
    return features[featureName] ?? false;
  };

  return {
    hasAccess,
    checkAccess: hasAccess, // Alias for hasAccess for compatibility
    isFeatureEnabled: hasAccess, // For compatibility
    isLoading,
    error,
    remainingUsage,
    usagePercentage
  };
};

export default useFeatureAccess;
