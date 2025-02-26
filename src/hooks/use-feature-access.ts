import { useSubscription } from './use-subscription';
import { toast } from 'sonner';

export const useFeatureAccess = () => {
  const { checkFeatureAccess, hasReachedLimit, currentPlan } = useSubscription();

  const checkAccess = async (feature: string) => {
    const hasAccess = await checkFeatureAccess(feature);
    if (!hasAccess) {
      toast.error(`This feature requires a higher subscription plan`);
      return false;
    }
    return true;
  };

  const checkUsageLimit = (type: 'bookmarks' | 'tasks' | 'notes') => {
    const reachedLimit = hasReachedLimit(type);
    if (reachedLimit) {
      toast.error(`You've reached your ${type} limit for the ${currentPlan} plan`);
      return false;
    }
    return true;
  };

  return {
    checkAccess,
    checkUsageLimit,
  };
};