
import { toast } from "sonner";

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

// Simplified implementation that returns mock data
export const checkPayPalConfiguration = async () => {
  return {
    clientId: DEFAULT_CLIENT_ID,
    mode: DEFAULT_MODE,
    configured: true
  };
};

export const getPayPalClientId = async (): Promise<string> => {
  return DEFAULT_CLIENT_ID;
};

export const getPayPalMode = async (): Promise<'sandbox' | 'live'> => {
  return DEFAULT_MODE;
};

// Mock verification function
export const verifyPayPalPayment = async (
  orderId: string, 
  planId: string, 
  autoRenew: boolean = true
): Promise<boolean> => {
  console.log('Mock payment verification for:', { orderId, planId, autoRenew });
  toast.success('Payment verified successfully (mock)');
  return true;
};

// Mock subscription status
export const checkSubscriptionStatus = async (userId: string): Promise<SubscriptionStatus | null> => {
  console.log('Mock subscription check for user:', userId);
  
  return {
    subscription: {
      plan_id: 'premium',
      status: 'active',
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      current_period_start: new Date().toISOString(),
      cancel_at_period_end: false
    },
    renewalNeeded: false,
    usageLimits: {
      aiRequests: { limit: 1000, used: 50, percentage: 5 },
      bookmarks: { limit: 5000, used: 250, percentage: 5 },
      tasks: { limit: 1000, used: 20, percentage: 2 },
      notes: { limit: 1000, used: 15, percentage: 1.5 }
    },
    needsUpgrade: false
  };
};

// Show upgrade notification if needed
export const checkAndShowUpgradeNotification = async (userId: string): Promise<void> => {
  console.log('Mock upgrade notification check for user:', userId);
};

// Mock order creation
export const createPayPalOrder = async (planId: string, amount: number): Promise<any> => {
  console.log('Mock order creation:', { planId, amount });
  return {
    id: `TEST-${Date.now()}`,
    status: "CREATED",
    amount: amount
  };
};

// Mock order capture
export const capturePayPalOrder = async (orderId: string): Promise<any> => {
  console.log('Mock order capture:', orderId);
  return {
    id: orderId,
    status: "COMPLETED",
    payer: {
      email_address: "test@example.com"
    }
  };
};
