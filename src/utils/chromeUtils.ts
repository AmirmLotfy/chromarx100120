
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// PayPal configuration types
interface PayPalConfig {
  clientId: string;
  mode: 'sandbox' | 'live';
  configured: boolean;
}

// Default PayPal Client ID as fallback
const DEFAULT_CLIENT_ID = "AZDxjDScFpQtjWTOUtWKbyN_bDt4OgqaF4eYXlewfBP4-8aqX3PiV8e1GWU6liB2CUXlkA59kJXE7M6R";
const DEFAULT_MODE = 'sandbox';

// Subscription types
export interface SubscriptionStatus {
  subscription: {
    plan_id: string;
    status: string;
    current_period_end?: string;
    current_period_start?: string;
    cancel_at_period_end?: boolean;
  };
  renewalNeeded: boolean;
  usageLimits: {
    aiRequests: UsageLimit;
    bookmarks: UsageLimit;
    tasks: UsageLimit;
    notes: UsageLimit;
  };
  needsUpgrade: boolean;
}

interface UsageLimit {
  limit: number;
  used: number;
  percentage: number;
}

export const checkPayPalConfiguration = async (): Promise<PayPalConfig> => {
  try {
    const { data, error } = await supabase.functions.invoke('check-paypal-config');
    
    if (error) {
      console.error('Error checking PayPal configuration:', error);
      return {
        clientId: DEFAULT_CLIENT_ID,
        mode: DEFAULT_MODE,
        configured: false
      };
    }
    
    return {
      clientId: data.clientId || DEFAULT_CLIENT_ID,
      mode: data.mode || DEFAULT_MODE,
      configured: data.configured || false
    };
  } catch (error) {
    console.error('Error checking PayPal configuration:', error);
    return {
      clientId: DEFAULT_CLIENT_ID,
      mode: DEFAULT_MODE,
      configured: false
    };
  }
};

export const getPayPalClientId = async (): Promise<string> => {
  try {
    // Use the new check function
    const config = await checkPayPalConfiguration();
    return config.clientId;
  } catch (error) {
    console.error('Error fetching PayPal client ID:', error);
    // Fallback to default client ID if fetch fails
    return DEFAULT_CLIENT_ID;
  }
};

export const getPayPalMode = async (): Promise<'sandbox' | 'live'> => {
  try {
    // Use the new check function
    const config = await checkPayPalConfiguration();
    return config.mode;
  } catch (error) {
    console.error('Error fetching PayPal mode:', error);
    // Fallback to default mode if fetch fails
    return DEFAULT_MODE;
  }
};

// Verify and process payment using Supabase Edge Function
export const verifyPayPalPayment = async (
  orderId: string, 
  planId: string, 
  autoRenew: boolean = true
): Promise<boolean> => {
  try {
    // First check if PayPal is configured
    const { configured } = await checkPayPalConfiguration();
    
    if (!configured) {
      console.error('PayPal is not properly configured');
      toast.error('PayPal is not properly configured. Please set up your PayPal credentials first.');
      return false;
    }
    
    const { data, error } = await supabase.functions.invoke('process-payment', {
      body: {
        orderId,
        planId,
        autoRenew
      }
    });

    if (error) {
      console.error('Error processing payment:', error);
      toast.error('Payment verification failed');
      return false;
    }

    if (!data.success) {
      console.error('Payment processing failed:', data.error);
      toast.error(data.error || 'Payment processing failed');
      return false;
    }

    console.log('Payment processed successfully:', data);
    return true;
  } catch (error) {
    console.error('Unexpected error verifying payment:', error);
    toast.error('Payment verification failed');
    return false;
  }
};

// Check subscription status and usage limits
export const checkSubscriptionStatus = async (userId: string): Promise<SubscriptionStatus | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('check-subscription', {
      body: userId
    });

    if (error) {
      console.error('Error checking subscription status:', error);
      return null;
    }

    if (!data.success) {
      console.error('Failed to check subscription:', data.error);
      return null;
    }

    return {
      subscription: data.subscription,
      renewalNeeded: data.renewalNeeded,
      usageLimits: data.usageLimits,
      needsUpgrade: data.needsUpgrade
    };
  } catch (error) {
    console.error('Unexpected error checking subscription:', error);
    return null;
  }
};

// Show upgrade notification if needed
export const checkAndShowUpgradeNotification = async (userId: string): Promise<void> => {
  try {
    const status = await checkSubscriptionStatus(userId);
    
    if (!status) return;
    
    // Show renewal notification
    if (status.renewalNeeded) {
      const endDate = new Date(status.subscription.current_period_end || '').toLocaleDateString();
      toast.info(
        `Your subscription will expire on ${endDate}. Please renew to avoid losing access to premium features.`,
        {
          duration: 10000,
          action: {
            label: "Renew Now",
            onClick: () => window.location.href = "/subscription"
          }
        }
      );
    }
    
    // Show upgrade notification for free users
    if (status.needsUpgrade) {
      const highestUsage = Object.entries(status.usageLimits)
        .map(([key, usage]) => ({ key, percentage: usage.percentage }))
        .sort((a, b) => b.percentage - a.percentage)[0];
        
      toast.warning(
        `You're using ${highestUsage.percentage}% of your ${highestUsage.key} limit. Upgrade to get more!`,
        {
          duration: 10000,
          action: {
            label: "Upgrade",
            onClick: () => window.location.href = "/subscription"
          }
        }
      );
    }
  } catch (error) {
    console.error('Error showing upgrade notification:', error);
  }
};

// These functions are deprecated and will be removed in future versions
// Use verifyPayPalPayment() instead
export const createPayPalOrder = async (planId: string, amount: number): Promise<any> => {
  console.warn('Direct order creation is deprecated. Use the PayPal SDK instead.');
  try {
    return {
      id: `TEST-${Date.now()}`,
      status: "CREATED",
      amount: amount
    };
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    toast.error('Failed to create order');
    throw error;
  }
};

export const capturePayPalOrder = async (orderId: string): Promise<any> => {
  console.warn('Direct order capture is deprecated. Use verifyPayPalPayment() instead.');
  try {
    return {
      id: orderId,
      status: "COMPLETED",
      payer: {
        email_address: "test@example.com"
      }
    };
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    toast.error('Failed to process payment');
    throw error;
  }
};
