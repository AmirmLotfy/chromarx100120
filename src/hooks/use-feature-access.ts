
import { useSubscription } from './use-subscription';
import { toast } from 'sonner';
import { useCallback } from 'react';

export const useFeatureAccess = () => {
  const { 
    checkFeatureAccess, 
    hasReachedLimit, 
    currentPlan, 
    getRemainingQuota,
    getPlanDetails
  } = useSubscription();

  const checkAccess = useCallback(async (feature: string, redirectOnFail: boolean = true) => {
    const hasAccess = await checkFeatureAccess(feature);
    
    if (!hasAccess) {
      const planInfo = subscriptionPlanWithFeature(feature);
      const message = planInfo 
        ? `This feature requires the ${planInfo} plan` 
        : `This feature requires a higher subscription plan`;
        
      toast.error(message, {
        action: redirectOnFail ? {
          label: "Upgrade",
          onClick: () => window.location.href = "/subscription"
        } : undefined
      });
      return false;
    }
    return true;
  }, [checkFeatureAccess]);

  const checkUsageLimit = useCallback((type: 'bookmarks' | 'tasks' | 'notes' | 'aiRequests', redirectOnFail: boolean = true) => {
    const reachedLimit = hasReachedLimit(type);
    const planDetails = getPlanDetails();
    
    if (reachedLimit) {
      const message = `You've reached your ${type} limit for the ${planDetails?.name || currentPlan} plan`;
      
      toast.error(message, {
        action: redirectOnFail ? {
          label: "Upgrade",
          onClick: () => window.location.href = "/subscription"
        } : undefined
      });
      return false;
    }
    return true;
  }, [hasReachedLimit, currentPlan, getPlanDetails]);

  const getUsageInfo = useCallback((type: 'bookmarks' | 'tasks' | 'notes' | 'aiRequests') => {
    const remaining = getRemainingQuota(type);
    const planDetails = getPlanDetails();
    const limit = planDetails?.limits[type] || 0;
    
    return {
      remaining,
      limit,
      isUnlimited: remaining === -1,
      usagePercentage: limit > 0 ? ((limit - remaining) / limit) * 100 : 0,
      planName: planDetails?.name || currentPlan
    };
  }, [getRemainingQuota, getPlanDetails, currentPlan]);

  // Helper function to find which plan has a specific feature
  const subscriptionPlanWithFeature = (feature: string) => {
    // This would typically come from a context or config
    const planNames = {
      'free': 'Free',
      'basic': 'Pro',
      'premium': 'Premium'
    };
    
    // Check which plan first includes this feature
    // For now we'll assume Pro plan has most features
    return planNames['basic']; // "Pro"
  };

  return {
    checkAccess,
    checkUsageLimit,
    getUsageInfo,
  };
};
