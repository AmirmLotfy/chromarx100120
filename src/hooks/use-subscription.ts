import { useState, useEffect } from 'react';
import { useFirebase } from '@/contexts/FirebaseContext';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

interface UsageData {
  bookmarks: number;
  tasks: number;
  notes: number;
}

interface SubscriptionHook {
  isLoading: boolean;
  currentPlan: string;
  usage: UsageData;
  incrementUsage: (type: keyof UsageData) => Promise<boolean>;
  checkFeatureAccess: (feature: string) => Promise<boolean>;
  hasReachedLimit: (type: keyof UsageData) => boolean;
}

export const useSubscription = (): SubscriptionHook => {
  const { user } = useFirebase();
  const [isLoading, setIsLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState('basic');
  const [usage, setUsage] = useState<UsageData>({
    bookmarks: 0,
    tasks: 0,
    notes: 0
  });

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const subscriptionId = userDoc.data()?.currentSubscription;
        
        if (subscriptionId) {
          const subscriptionDoc = await getDoc(doc(db, 'subscriptions', subscriptionId));
          if (subscriptionDoc.exists()) {
            setCurrentPlan(subscriptionDoc.data().planId);
            setUsage(subscriptionDoc.data().usage || {
              bookmarks: 0,
              tasks: 0,
              notes: 0
            });
          }
        }
      } catch (error) {
        console.error('Error fetching subscription data:', error);
        toast.error('Failed to load subscription data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionData();
  }, [user]);

  const incrementUsage = async (type: keyof UsageData): Promise<boolean> => {
    if (!user) return false;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const subscriptionId = userDoc.data()?.currentSubscription;
      
      if (subscriptionId) {
        await updateDoc(doc(db, 'subscriptions', subscriptionId), {
          [`usage.${type}`]: increment(1)
        });
        setUsage(prev => ({
          ...prev,
          [type]: prev[type] + 1
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      return false;
    }
  };

  const checkFeatureAccess = async (feature: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const subscriptionId = userDoc.data()?.currentSubscription;
      
      if (subscriptionId) {
        const subscriptionDoc = await getDoc(doc(db, 'subscriptions', subscriptionId));
        if (subscriptionDoc.exists()) {
          const planId = subscriptionDoc.data().planId;
          // Use the existing getFeatureAvailability function
          return getFeatureAvailability(planId, feature);
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false;
    }
  };

  const hasReachedLimit = (type: keyof UsageData): boolean => {
    const plan = subscriptionPlans.find(p => p.id === currentPlan);
    if (!plan || !plan.limits) return true;
    
    const limit = plan.limits[type];
    if (limit === -1) return false; // Unlimited
    return usage[type] >= limit;
  };

  return {
    isLoading,
    currentPlan,
    usage,
    incrementUsage,
    checkFeatureAccess,
    hasReachedLimit
  };
};