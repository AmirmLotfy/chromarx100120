
import { useState, useEffect } from 'react';
import { localStorageClient as supabase } from '@/lib/local-storage-client';

interface FeatureFlags {
  aiSuggestions: boolean;
  bookmarkSearch: boolean;
  contentSummary: boolean;
  advancedAnalytics: boolean;
  syncFeature: boolean;
  premiumThemes: boolean;
  webSearch: boolean;
}

// Default values for feature flags
const defaultFeatures: FeatureFlags = {
  aiSuggestions: true,
  bookmarkSearch: true,
  contentSummary: true,
  advancedAnalytics: false,
  syncFeature: false,
  premiumThemes: false,
  webSearch: true
};

export const useFeaturesEnabled = () => {
  const [features, setFeatures] = useState<FeatureFlags>(defaultFeatures);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const fetchFeatureFlags = async () => {
      try {
        // Check if user is premium
        const { data: user } = await supabase.auth.getUser();
        
        const subscriptionResult = await supabase
          .from('user_subscriptions')
          .select()
          .eq('user_id', user.user?.id)
          .single();
        
        const hasPremium = !!subscriptionResult.data && subscriptionResult.data.status === 'active';
        setIsPremium(hasPremium);
        
        // Get feature flags from settings
        const featureFlagsResult = await supabase
          .from('feature_flags')
          .select()
          .execute();
        
        if (featureFlagsResult.data?.length > 0) {
          const flags = featureFlagsResult.data.reduce((acc: Partial<FeatureFlags>, flag: any) => {
            // Only enable premium features if user has premium subscription
            if (flag.premium && !hasPremium) {
              acc[flag.name as keyof FeatureFlags] = false;
            } else {
              acc[flag.name as keyof FeatureFlags] = flag.enabled;
            }
            return acc;
          }, {});
          
          setFeatures(prev => ({ ...prev, ...flags }));
        }
      } catch (error) {
        console.error('Error fetching feature flags:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFeatureFlags();
  }, []);
  
  // Check if a specific feature is enabled
  const isFeatureEnabled = (featureName: keyof FeatureFlags) => {
    return features[featureName];
  };
  
  return { 
    features, 
    loading, 
    isPremium, 
    isFeatureEnabled 
  };
};

// Add a new hook that aliases useFeaturesEnabled for backward compatibility
export const useFeatureAccess = () => {
  const featureState = useFeaturesEnabled();
  
  // Provide a backward-compatible API
  return {
    ...featureState,
    checkAccess: (feature: string) => {
      // Map the feature string to a known feature flag if possible
      const featureKey = feature as keyof FeatureFlags;
      if (featureKey in featureState.features) {
        return Promise.resolve(featureState.isFeatureEnabled(featureKey));
      }
      // For unknown features, default to false
      return Promise.resolve(false);
    }
  };
};
