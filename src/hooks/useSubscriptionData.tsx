
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/use-toast";
import { 
  checkSubscriptionStatus, 
  getPayPalClientId, 
  getPayPalMode 
} from "@/utils/chromeUtils";

// Define the interfaces for subscription data
export interface UsageLimit {
  limit: number;
  used: number;
  percentage: number;
}

export interface SubscriptionUsageLimits {
  aiRequests: UsageLimit;
  bookmarks: UsageLimit;
  tasks: UsageLimit;
  notes: UsageLimit;
  [key: string]: UsageLimit;
}

export interface SubscriptionStatusData {
  subscription: {
    plan_id: string;
    status: string;
    current_period_end?: string;
    current_period_start?: string;
    cancel_at_period_end?: boolean;
  };
  renewalNeeded: boolean;
  usageLimits: SubscriptionUsageLimits;
  needsUpgrade: boolean;
}

export interface UseSubscriptionDataReturn {
  subscriptionStatus: SubscriptionStatusData | null;
  isLoading: boolean;
  paypalClientId: string;
  paypalMode: "sandbox" | "live";
  isPayPalLoading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing subscription data
 */
export const useSubscriptionData = (): UseSubscriptionDataReturn => {
  const { user } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paypalClientId, setPaypalClientId] = useState("");
  const [paypalMode, setPaypalMode] = useState<"sandbox" | "live">("sandbox");
  const [isPayPalLoading, setIsPayPalLoading] = useState(true);

  const loadSubscriptionData = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const status = await checkSubscriptionStatus(user.id);
      setSubscriptionStatus(status);
    } catch (error) {
      console.error("Failed to load subscription status:", error);
      toast({
        variant: "destructive",
        title: "Failed to load subscription status.",
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPayPalConfig = async () => {
    setIsPayPalLoading(true);
    try {
      const clientId = await getPayPalClientId();
      const mode = await getPayPalMode();
      setPaypalClientId(clientId);
      setPaypalMode(mode);
    } catch (error) {
      console.error("Failed to load PayPal configuration:", error);
      toast({
        variant: "destructive",
        title: "Failed to load PayPal configuration.",
        description: "Please check your PayPal settings.",
      });
    } finally {
      setIsPayPalLoading(false);
    }
  };

  const refresh = async () => {
    if (user?.id) {
      await Promise.all([
        loadSubscriptionData(),
        loadPayPalConfig()
      ]);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadSubscriptionData();
      loadPayPalConfig();
    }
  }, [user?.id]);

  return {
    subscriptionStatus,
    isLoading,
    paypalClientId,
    paypalMode,
    isPayPalLoading,
    refresh
  };
};
