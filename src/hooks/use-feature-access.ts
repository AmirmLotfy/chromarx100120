
import { useState, useEffect } from 'react';
import { localStorageClient as supabase } from "@/lib/local-storage-client";

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
        // This would normally fetch from a backend service
        // Using mock data for now
        setFeatures({
          'ai_chat': true,
          'notes': true,
          'bookmarks': true,
          'analytics': true,
          'timer': true,
          'premium_themes': false,
          'advanced_export': false
        });
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
