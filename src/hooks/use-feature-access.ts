
import { useState, useEffect } from 'react';
import { chromeStorage } from "@/services/chromeStorageService";

export interface FeatureAccessHook {
  hasAccess: (featureName: string) => boolean;
  checkAccess: (featureName: string) => boolean; // Alias for hasAccess for compatibility
  isLoading: boolean;
  error: Error | null;
}

// For compatibility with existing code
export const useFeaturesEnabled = () => {
  return {
    isEnabled: (feature: string) => true,
    isFeatureEnabled: (feature: string) => true, // Added for backward compatibility
    loading: false
  };
};

export const useFeatureAccess = (): FeatureAccessHook => {
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchFeatureAccess = async () => {
      try {
        // Get subscription to determine feature access
        const subscription = await chromeStorage.get('subscription');
        
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
          'premium_themes': false,
          'advanced_export': false
        };
        
        // Determine feature access based on subscription
        if (subscription && subscription.planId) {
          if (subscription.planId === 'premium') {
            // Premium users get all features
            setFeatures({
              ...defaultFeatures,
              ...Object.fromEntries(Object.keys(premiumFeatures).map(key => [key, true]))
            });
          } else if (subscription.planId === 'basic') {
            // Basic users get default features plus some premium ones
            setFeatures({
              ...defaultFeatures,
              'premium_themes': true,
              'advanced_export': false
            });
          } else {
            // Free users get only default features
            setFeatures(defaultFeatures);
          }
        } else {
          // No subscription found, use default features
          setFeatures(defaultFeatures);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch feature access'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeatureAccess();
  }, []);

  const hasAccess = (featureName: string): boolean => {
    return features[featureName] ?? false;
  };

  return {
    hasAccess,
    checkAccess: hasAccess, // Alias for hasAccess for compatibility
    isLoading,
    error
  };
};

export default useFeatureAccess;
